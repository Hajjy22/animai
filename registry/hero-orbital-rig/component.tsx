"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import { Color, MeshStandardMaterial } from "three";
import type { Group, Material, Mesh, Object3D, Texture } from "three";

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
  const groupRef = useRef<Group>(null);
  const parallax = useRef({ x: 0, y: 0 });

  const coreMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#38bdf8"),
        emissive: new Color("#38bdf8"),
        emissiveIntensity: 2.2,
        metalness: 0.2,
        roughness: 0.25,
      }),
    [],
  );
  const ringMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#7dd3fc"),
        emissive: new Color("#0ea5e9"),
        emissiveIntensity: 1.6,
        metalness: 0.4,
        roughness: 0.3,
      }),
    [],
  );
  const accentRingMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#fde68a"),
        emissive: new Color("#f59e0b"),
        emissiveIntensity: 1.3,
        metalness: 0.3,
        roughness: 0.35,
      }),
    [],
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }
    group.rotation.y += delta * 0.15;
    parallax.current.x += (state.pointer.x * 0.35 - parallax.current.x) * 0.06;
    parallax.current.y += (state.pointer.y * 0.2 - parallax.current.y) * 0.06;
    group.rotation.x = parallax.current.y * 0.3;
    group.position.x = parallax.current.x * 0.4;
  });

  useEffect(() => {
    return () => {
      const disposedMaterials = new Set<Material>();
      const disposedTextures = new Set<Texture>();

      const disposeMaterial = (material: Material) => {
        if (disposedMaterials.has(material)) {
          return;
        }

        for (const value of Object.values(material as unknown as Record<string, unknown>)) {
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
    <group ref={groupRef}>
      <Float speed={1.1} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh material={coreMaterial}>
          <icosahedronGeometry args={[1.15, 2]} />
        </mesh>
        <mesh rotation={[0.72, 0.22, 0.44]} material={ringMaterial}>
          <torusGeometry args={[1.7, 0.02, 16, 160]} />
        </mesh>
        <mesh rotation={[-0.44, 0.58, -0.28]} material={accentRingMaterial}>
          <torusGeometry args={[2.05, 0.014, 16, 160]} />
        </mesh>
      </Float>
    </group>
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
        <fog attach="fog" args={["#020617", 4, 12]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} color="#fef3c7" />
        <CachedOrbitalRigScene />
        <EffectComposer>
          <Bloom intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </section>
  );
}
