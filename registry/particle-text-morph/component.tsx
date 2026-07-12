"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  ShaderMaterial,
  Vector2,
} from "three";

const WORDS = ["DESIGN", "MOTION", "DETAIL"];
const PARTICLE_COUNT = 3500;
const HOLD_SECONDS = 1.8;
const MORPH_SECONDS = 1.5;

// Rasterize a word to particle positions using an offscreen 2D canvas — no
// font assets, no network. Runs client-side only (the loader gates SSR).
function rasterizeWord(word: string, count: number): Float32Array {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const out = new Float32Array(count * 3);
  if (!ctx) return out;

  ctx.fillStyle = "#fff";
  ctx.font = "900 190px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(word, 512, 132);

  const data = ctx.getImageData(0, 0, 1024, 256).data;
  const pixels: number[] = [];
  for (let y = 0; y < 256; y += 2) {
    for (let x = 0; x < 1024; x += 2) {
      if (data[(y * 1024 + x) * 4 + 3] > 128) {
        pixels.push(x, y);
      }
    }
  }

  const pixelCount = pixels.length / 2;
  for (let i = 0; i < count; i += 1) {
    const pick = Math.floor(Math.random() * pixelCount);
    const px = pixels[pick * 2];
    const py = pixels[pick * 2 + 1];
    out[i * 3] = ((px - 512) / 1024) * 11;
    out[i * 3 + 1] = (-(py - 132) / 256) * 2.75;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  }
  return out;
}

const VERTEX_SHADER = `
  uniform float uProgress;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPixelRatio;
  attribute vec3 aTarget;
  attribute float aSeed;
  varying float vSeed;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  vec2 curl(vec2 p) {
    float e = 0.06;
    float dx = vnoise(p + vec2(e, 0.0)) - vnoise(p - vec2(e, 0.0));
    float dy = vnoise(p + vec2(0.0, e)) - vnoise(p - vec2(0.0, e));
    return vec2(dy, -dx);
  }

  void main() {
    vSeed = aSeed;
    vec3 pos = mix(position, aTarget, uProgress);

    // Mid-flight scatter: strongest at uProgress = 0.5, zero at rest.
    float flight = sin(uProgress * 3.14159265);
    pos.xy += curl(pos.xy * 0.6 + aSeed * 12.0 + uTime * 0.1) * flight * 1.6;
    pos.z += (aSeed - 0.5) * flight * 1.2;

    // Gentle idle shimmer so the settled word still breathes.
    pos.xy += curl(pos.xy * 1.4 + uTime * 0.15) * 0.02;

    // Pointer repulsion.
    vec2 toPointer = pos.xy - uPointer;
    float dist = length(toPointer);
    float repel = smoothstep(1.4, 0.0, dist) * 0.5;
    pos.xy += normalize(toPointer + 0.0001) * repel;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (1.6 + aSeed * 1.8) * uPixelRatio;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uColor;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float alpha = smoothstep(0.5, 0.05, length(uv));
    alpha *= 0.5 + 0.5 * vSeed;
    gl_FragColor = vec4(uColor + vSeed * 0.25, alpha);
  }
`;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function MorphScene() {
  const cycle = useRef({ mode: "hold" as "hold" | "morph", t: 0, wordIndex: 0 });

  const geometry = useMemo(() => {
    const from = rasterizeWord(WORDS[0], PARTICLE_COUNT);
    const to = rasterizeWord(WORDS[1], PARTICLE_COUNT);
    const seeds = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      seeds[i] = Math.random();
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(from, 3));
    geo.setAttribute("aTarget", new Float32BufferAttribute(to, 3));
    geo.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uPointer: { value: new Vector2(999, 999) },
          uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
          uColor: { value: new Color("#38bdf8") },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPointer.value.set(state.pointer.x * 5.5, state.pointer.y * 2.5);

    const c = cycle.current;
    if (c.mode === "hold") {
      c.t += delta;
      if (c.t >= HOLD_SECONDS) {
        c.mode = "morph";
        c.t = 0;
      }
    } else {
      c.t += delta / MORPH_SECONDS;
      material.uniforms.uProgress.value = easeInOutCubic(Math.min(c.t, 1));
      if (c.t >= 1) {
        // Land on the target word: it becomes the new "from", and the next
        // word in the cycle becomes the new target.
        const positionAttr = geometry.getAttribute("position") as Float32BufferAttribute;
        const targetAttr = geometry.getAttribute("aTarget") as Float32BufferAttribute;
        positionAttr.copyArray(targetAttr.array as Float32Array);
        positionAttr.needsUpdate = true;

        c.wordIndex = (c.wordIndex + 1) % WORDS.length;
        const nextWord = WORDS[(c.wordIndex + 1) % WORDS.length];
        targetAttr.copyArray(rasterizeWord(nextWord, PARTICLE_COUNT));
        targetAttr.needsUpdate = true;

        material.uniforms.uProgress.value = 0;
        c.mode = "hold";
        c.t = 0;
      }
    }
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <points geometry={geometry} material={material} />;
}

export default function ParticleTextMorph() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-slate-950">
      <Canvas className="absolute inset-0" camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
        <MorphScene />
      </Canvas>
    </section>
  );
}
