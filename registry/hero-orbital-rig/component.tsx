"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Color, MeshStandardMaterial } from "three";
import type { Material, Mesh, Object3D, Texture } from "three";

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value &&
      typeof value === "object" &&
      "isTexture" in value &&
      "dispose" in value,
  );
}

function CachedOrbitalRigScene() {
  const { scene } = useThree();
  const accentMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#38bdf8"),
        emissive: new Color("#0f172a"),
        metalness: 0.35,
        roughness: 0.28,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      const disposedMaterials = new Set<Material>();
      const disposedTextures = new Set<Texture>();

      const disposeMaterial = (material: Material) => {
        if (disposedMaterials.has(material)) {
          return;
        }

        for (const value of Object.values(material as Record<string, unknown>)) {
          if (isTexture(value) && !disposedTextures.has(value)) {
            value.dispose();
            disposedTextures.add(value);
          }
        }

        material.dispose();
        disposedMaterials.add(material);
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
    <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.45}>
      <group>
        <mesh material={accentMaterial}>
          <icosahedronGeometry args={[1.15, 2]} />
        </mesh>
        <mesh rotation={[0.72, 0.22, 0.44]} material={accentMaterial}>
          <torusGeometry args={[1.7, 0.018, 16, 160]} />
        </mesh>
        <mesh rotation={[-0.44, 0.58, -0.28]} material={accentMaterial}>
          <torusGeometry args={[2.05, 0.012, 16, 160]} />
        </mesh>
      </group>
    </Float>
  );
}

export default function AnimAIMotionHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-slate-950">
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 5], fov: 42 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <CachedOrbitalRigScene />
        <Environment preset="city" />
      </Canvas>
    </section>
  );
}
