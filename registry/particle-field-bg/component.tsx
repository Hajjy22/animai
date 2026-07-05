"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from "three";
import type { Material, Object3D, Texture } from "three";

const PARTICLE_COUNT = 800;

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value &&
      typeof value === "object" &&
      "isTexture" in value &&
      "dispose" in value,
  );
}

function ParticleField() {
  const pointsRef = useRef<Points>(null);
  const { scene } = useThree();

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new PointsMaterial({
        color: new Color("#38bdf8"),
        size: 0.035,
        transparent: true,
        opacity: 0.75,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.03;
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

      geometry.dispose();
      material.dispose();
    };
  }, [scene, geometry, material]);

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
