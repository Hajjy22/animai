"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, ShaderMaterial, Vector2 } from "three";

// Procedural demo artwork drawn to an offscreen canvas — keeps the component
// asset-free. In your app, replace this with a TextureLoader + your image URL
// (remember to dispose the loaded texture the same way).
function createDemoTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 640);
    sky.addColorStop(0, "#0f172a");
    sky.addColorStop(0.55, "#7c3aed");
    sky.addColorStop(0.8, "#f472b6");
    sky.addColorStop(1, "#fbbf24");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 640);

    // Sun
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.arc(512, 470, 90, 0, Math.PI * 2);
    ctx.fill();

    // Mountain silhouettes
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.moveTo(0, 640);
    ctx.lineTo(0, 480);
    ctx.lineTo(190, 360);
    ctx.lineTo(360, 500);
    ctx.lineTo(560, 380);
    ctx.lineTo(760, 520);
    ctx.lineTo(1024, 400);
    ctx.lineTo(1024, 640);
    ctx.closePath();
    ctx.fill();

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 90; i += 1) {
      const x = Math.random() * 1024;
      const y = Math.random() * 260;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const texture = new CanvasTexture(canvas);
  return texture;
}

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D uMap;
  uniform vec2 uPointer;
  uniform float uTime;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    vec2 toPointer = vUv - uPointer;
    // Correct for the plane's aspect so ripples stay circular.
    toPointer.x *= 1.6;
    float dist = length(toPointer);

    // Ripple rings radiating from the cursor, fading with distance.
    float falloff = smoothstep(0.55, 0.0, dist);
    float ripple = sin(dist * 42.0 - uTime * 5.0) * 0.012;
    vec2 offset = normalize(toPointer + 0.0001) * ripple * falloff * uStrength;

    // Slight chromatic split on the ripple crest for the "liquid" richness.
    float r = texture2D(uMap, vUv + offset * 1.15).r;
    float g = texture2D(uMap, vUv + offset).g;
    float b = texture2D(uMap, vUv + offset * 0.85).b;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

function LiquidPlane() {
  const material = useMemo(() => {
    const texture = createDemoTexture();
    return new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uMap: { value: texture },
        uPointer: { value: new Vector2(0.5, 0.5) },
        uTime: { value: 0 },
        uStrength: { value: 0 },
      },
    });
  }, []);

  const targetStrength = useRef(0);

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    // R3F pointer is -1..1 over the canvas; map to UV space.
    material.uniforms.uPointer.value.set(
      state.pointer.x * 0.5 + 0.5,
      state.pointer.y * 0.5 + 0.5,
    );
    // Ease the ripple strength toward hover state (pointer inside canvas).
    const inside =
      Math.abs(state.pointer.x) <= 1 && Math.abs(state.pointer.y) <= 1 ? 1 : 0;
    targetStrength.current = inside;
    material.uniforms.uStrength.value +=
      (targetStrength.current - material.uniforms.uStrength.value) *
      Math.min(delta * 4, 1);
  });

  useEffect(() => {
    return () => {
      (material.uniforms.uMap.value as CanvasTexture).dispose();
      material.dispose();
    };
  }, [material]);

  return (
    <mesh material={material}>
      <planeGeometry args={[6.4, 4, 1, 1]} />
    </mesh>
  );
}

export default function LiquidImageHover() {
  return (
    <section className="flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950">
      <div className="relative aspect-[8/5] w-full max-w-2xl overflow-hidden rounded-2xl">
        <Canvas className="absolute inset-0" camera={{ position: [0, 0, 3.2], fov: 65 }} dpr={[1, 2]}>
          <LiquidPlane />
        </Canvas>
      </div>
    </section>
  );
}
