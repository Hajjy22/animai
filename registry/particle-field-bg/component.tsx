"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  ShaderMaterial,
  Vector2,
} from "three";
import type { Material, Object3D, Points, Texture } from "three";

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value &&
      typeof value === "object" &&
      "isTexture" in value &&
      "dispose" in value,
  );
}

const PARTICLE_COUNT = 900;

const VERTEX_SHADER = `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vDepth;
  varying float vSeed;

  // Pseudo-curl noise: rotate the gradient of a cheap value-noise field 90
  // degrees to get a divergence-free (curl-like) drift, without needing a
  // full simplex-noise implementation.
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
    vec3 pos = position;
    vec2 drift = curl(pos.xy * 0.25 + uTime * 0.06 + aSeed * 10.0);
    pos.xy += drift * 0.9;
    pos.z += sin(uTime * 0.3 + aSeed * 20.0) * 0.3;

    // Gentle pointer repulsion in the XY plane.
    vec2 toPointer = pos.xy - uPointer;
    float dist = length(toPointer);
    float repel = smoothstep(2.2, 0.0, dist) * 0.6;
    pos.xy += normalize(toPointer + 0.0001) * repel;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDepth = clamp(-mvPosition.z / 10.0, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (2.4 + aSeed * 2.2) * uPixelRatio * (1.0 - vDepth * 0.6);
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uColor;
  varying float vDepth;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float alpha = smoothstep(0.5, 0.0, dist);
    alpha *= mix(1.0, 0.25, vDepth);
    alpha *= 0.55 + 0.45 * vSeed;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function ParticleField() {
  const { scene } = useThree();
  const pointsRef = useRef<Points>(null);
  const pointer = useRef(new Vector2(999, 999));

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const seeds = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      seeds[i] = Math.random();
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
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

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    pointer.current.set(state.pointer.x * 5, state.pointer.y * 4);
    material.uniforms.uPointer.value.copy(pointer.current);
  });

  useEffect(() => {
    return () => {
      const disposedMaterials = new Set<Material>();
      const disposedTextures = new Set<Texture>();

      const disposeMaterial = (mat: Material) => {
        if (disposedMaterials.has(mat)) {
          return;
        }
        for (const value of Object.values(mat as unknown as Record<string, unknown>)) {
          if (isTexture(value) && !disposedTextures.has(value)) {
            value.dispose();
            disposedTextures.add(value);
          }
        }
        mat.dispose();
        disposedMaterials.add(mat);
      };

      scene.traverse((object: Object3D) => {
        const points = object as Points;
        if (points.geometry) {
          points.geometry.dispose();
        }
        if (Array.isArray(points.material)) {
          points.material.forEach(disposeMaterial);
        } else if (points.material) {
          disposeMaterial(points.material);
        }
      });
    };
  }, [scene]);

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export default function AnimAIParticleFieldBackground() {
  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-slate-950">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 2]}>
        <ParticleField />
      </Canvas>
    </div>
  );
}
