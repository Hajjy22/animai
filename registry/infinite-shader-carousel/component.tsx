"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, Color, ShaderMaterial } from "three";
import type { Mesh } from "three";

const COUNT = 6;
const GAP = 3.0; // world-x spacing between slide centers
const TOTAL = COUNT * GAP;

const PALETTES: [string, string][] = [
  ["#0ea5e9", "#7c3aed"],
  ["#f472b6", "#fbbf24"],
  ["#22d3ee", "#0f766e"],
  ["#a78bfa", "#ec4899"],
  ["#34d399", "#0ea5e9"],
  ["#fb7185", "#7c3aed"],
];

function createSlideTexture(index: number): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const [a, b] = PALETTES[index % PALETTES.length];
    const grad = ctx.createLinearGradient(0, 0, 512, 640);
    grad.addColorStop(0, a);
    grad.addColorStop(1, b);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 640);
    ctx.fillStyle = "rgba(2,6,23,0.25)";
    for (let i = 0; i < 40; i += 1) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 640, Math.random() * 40 + 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 120px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index + 1).padStart(2, "0"), 256, 320);
  }
  return new CanvasTexture(canvas);
}

const VERTEX_SHADER = `
  uniform float uVelocity;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    // Bend the plane along its width based on drag velocity — the faster the
    // drag, the more the slide curves away, like film being pulled.
    pos.z += sin(uv.x * 3.14159) * uVelocity * -2.2;
    pos.x += sin(uv.y * 3.14159) * uVelocity * 0.4;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D uMap;
  uniform float uVelocity;
  varying vec2 vUv;
  void main() {
    // RGB split proportional to speed for a motion-smear feel.
    float amt = clamp(abs(uVelocity) * 0.5, 0.0, 0.08);
    float r = texture2D(uMap, vUv + vec2(amt, 0.0)).r;
    float g = texture2D(uMap, vUv).g;
    float b = texture2D(uMap, vUv - vec2(amt, 0.0)).b;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

function Carousel() {
  const { scene, gl } = useThree();
  const meshRefs = useRef<(Mesh | null)[]>([]);
  const scrollX = useRef(0);
  const targetVel = useRef(0);
  const drag = useRef({ active: false, lastX: 0 });

  const materials = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const texture = createSlideTexture(i);
        return new ShaderMaterial({
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          uniforms: {
            uMap: { value: texture },
            uVelocity: { value: 0 },
          },
        });
      }),
    [],
  );

  // wrap a value into [-TOTAL/2, TOTAL/2) so slides recycle infinitely
  const wrap = (x: number) => {
    const half = TOTAL / 2;
    return ((((x + half) % TOTAL) + TOTAL) % TOTAL) - half;
  };

  useFrame((_, delta) => {
    if (!drag.current.active) {
      scrollX.current += 0.4 * delta; // gentle auto-drift
      targetVel.current *= 0.9;
    }
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.position.x = wrap(i * GAP + scrollX.current);
      const mat = materials[i];
      mat.uniforms.uVelocity.value +=
        (targetVel.current - mat.uniforms.uVelocity.value) * Math.min(delta * 6, 1);
    });
  });

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      drag.current.active = true;
      drag.current.lastX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.lastX;
      drag.current.lastX = e.clientX;
      scrollX.current += dx * 0.01;
      targetVel.current = dx * 0.01;
    };
    const onUp = () => {
      drag.current.active = false;
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  useEffect(() => {
    return () => {
      scene.traverse((object) => {
        const mesh = object as Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      materials.forEach((mat) => {
        (mat.uniforms.uMap.value as CanvasTexture).dispose();
        mat.dispose();
      });
    };
  }, [scene, materials]);

  return (
    <>
      {materials.map((material, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          material={material}
        >
          <planeGeometry args={[2.2, 2.75, 24, 1]} />
        </mesh>
      ))}
    </>
  );
}

export default function InfiniteShaderCarousel() {
  return (
    <section className="relative h-screen w-full cursor-grab overflow-hidden bg-slate-950 active:cursor-grabbing">
      <Canvas className="absolute inset-0" camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 2]}>
        <Carousel />
      </Canvas>
      <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-center">
        <p className="text-sm uppercase tracking-widest text-slate-400">Drag to browse</p>
      </div>
    </section>
  );
}
