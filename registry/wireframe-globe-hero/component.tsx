"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, Group, MeshBasicMaterial, MeshStandardMaterial } from "three";
import type { Material, Mesh, Object3D, Texture } from "three";

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value &&
      typeof value === "object" &&
      "isTexture" in value &&
      "dispose" in value,
  );
}

function WireframeGlobeScene() {
  const { scene } = useThree();
  const globeGroupRef = useRef<Group>(null);
  const dotsGroupRef = useRef<Group>(null);

  const wireMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color("#38bdf8"),
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      }),
    [],
  );
  const dotMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#e2e8f0"),
        emissive: new Color("#38bdf8"),
        emissiveIntensity: 0.6,
      }),
    [],
  );

  const dotPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const count = 24;
    for (let i = 0; i < count; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 1.6;
      positions.push([
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      ]);
    }
    return positions;
  }, []);

  useFrame((_, delta) => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += delta * 0.12;
    }
    if (dotsGroupRef.current) {
      dotsGroupRef.current.rotation.y -= delta * 0.06;
    }
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
    <>
      <group ref={globeGroupRef}>
        <mesh material={wireMaterial}>
          <sphereGeometry args={[1.6, 24, 18]} />
        </mesh>
      </group>
      <group ref={dotsGroupRef}>
        {dotPositions.map((position, index) => (
          <mesh key={index} position={position} material={dotMaterial}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
        ))}
      </group>
    </>
  );
}

export default function WireframeGlobeHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-slate-950">
      <Canvas className="absolute inset-0" camera={{ position: [0, 0, 5], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.8} />
        <WireframeGlobeScene />
      </Canvas>
    </section>
  );
}
