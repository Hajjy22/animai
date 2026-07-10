"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, ShaderMaterial } from "three";
import type { Material, Mesh, Object3D, Texture } from "three";

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value &&
      typeof value === "object" &&
      "isTexture" in value &&
      "dispose" in value,
  );
}

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Classic domain-warped fbm ("aurora"/mesh-gradient) technique: cheap,
// single-pass, no extra render targets — safe on constrained GPUs, unlike
// techniques that need an offscreen buffer (see docs/vetting.md).
const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uColorD;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= 1.6;
    float t = uTime * uSpeed;

    vec2 q = vec2(fbm(uv + t * 0.15), fbm(uv + vec2(5.2, 1.3) + t * 0.12));
    vec2 r = vec2(
      fbm(uv + 2.2 * q + vec2(1.7, 9.2) + t * 0.18),
      fbm(uv + 2.2 * q + vec2(8.3, 2.8) + t * 0.14)
    );
    float f = fbm(uv + 2.4 * r);

    // A 4-stop gradient map driven by the warped fbm value, so all four
    // colors read as distinct flowing bands instead of washing into one hue.
    float band = clamp(f, 0.0, 1.0);
    vec3 color = uColorA;
    color = mix(color, uColorB, smoothstep(0.0, 0.35, band));
    color = mix(color, uColorC, smoothstep(0.28, 0.55, band));
    color = mix(color, uColorD, smoothstep(0.48, 0.75, band));

    float grain = (hash(vUv * 800.0 + t) - 0.5) * 0.025;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export type ShaderGradientBgProps = {
  colorA?: string;
  colorB?: string;
  colorC?: string;
  colorD?: string;
  speed?: number;
};

function ShaderGradientScene({
  colorA = "#020617",
  colorB = "#0ea5e9",
  colorC = "#7c3aed",
  colorD = "#22d3ee",
  speed = 1,
}: ShaderGradientBgProps) {
  const { scene } = useThree();

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: speed },
          uColorA: { value: new Color(colorA) },
          uColorB: { value: new Color(colorB) },
          uColorC: { value: new Color(colorC) },
          uColorD: { value: new Color(colorD) },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
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
        const mesh = object as Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(disposeMaterial);
        } else if (mesh.material) {
          disposeMaterial(mesh.material);
        }
      });
    };
  }, [scene]);

  return (
    <mesh material={material} scale={[6, 4, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
    </mesh>
  );
}

export default function ShaderGradientBg(props: ShaderGradientBgProps) {
  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-slate-950">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }} dpr={[1, 2]}>
        <ShaderGradientScene {...props} />
      </Canvas>
    </div>
  );
}
