"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { CanvasTexture, ShaderMaterial } from "three";

// Procedural demo artwork — asset-free. Swap for TextureLoader + your image
// in your app (dispose the loaded texture in the same cleanup).
function createDemoTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 1024, 640);
    bg.addColorStop(0, "#0ea5e9");
    bg.addColorStop(0.5, "#7c3aed");
    bg.addColorStop(1, "#0f172a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 640);

    // Concentric ring motif
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    for (let i = 1; i <= 8; i += 1) {
      ctx.lineWidth = 2 + i * 0.5;
      ctx.beginPath();
      ctx.arc(512, 320, i * 55, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.arc(512, 320, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  return new CanvasTexture(canvas);
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
  uniform float uProgress;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Dissolve frontier sweeps left-to-right, roughened by fbm noise.
    float edge = vUv.x * 0.7 + fbm(vUv * 6.0) * 0.3;
    float revealed = smoothstep(edge, edge + 0.03, uProgress);

    vec4 image = texture2D(uMap, vUv);
    vec3 base = vec3(0.008, 0.024, 0.09); // slate-950 backdrop

    // Glowing frontier where the dissolve is actively happening.
    float frontier = smoothstep(0.08, 0.0, abs(uProgress - edge)) * step(0.01, uProgress) * step(uProgress, 0.99);
    vec3 glow = vec3(0.22, 0.74, 0.97) * frontier * 1.4;

    gl_FragColor = vec4(mix(base, image.rgb, revealed) + glow, 1.0);
  }
`;

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function RevealPlane() {
  const material = useMemo(() => {
    const texture = createDemoTexture();
    return new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uMap: { value: texture },
        uProgress: { value: 0 },
      },
    });
  }, []);

  useFrame((state) => {
    // Auto-cycle: reveal over 2.2s, hold, dissolve back, hold.
    const cycle = (state.clock.elapsedTime % 6) / 6;
    let progress: number;
    if (cycle < 0.37) {
      progress = easeInOutSine(cycle / 0.37);
    } else if (cycle < 0.55) {
      progress = 1;
    } else if (cycle < 0.92) {
      progress = 1 - easeInOutSine((cycle - 0.55) / 0.37);
    } else {
      progress = 0;
    }
    material.uniforms.uProgress.value = progress;
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

export default function ShaderImageReveal() {
  return (
    <section className="flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950">
      <div className="relative aspect-[8/5] w-full max-w-2xl overflow-hidden rounded-2xl">
        <Canvas className="absolute inset-0" camera={{ position: [0, 0, 3.2], fov: 65 }} dpr={[1, 2]}>
          <RevealPlane />
        </Canvas>
      </div>
    </section>
  );
}
