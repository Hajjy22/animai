"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, Group, MeshStandardMaterial } from "three";
import type { Material, Mesh, Object3D, Texture } from "three";

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value &&
      typeof value === "object" &&
      "isTexture" in value &&
      "dispose" in value,
  );
}

type Finish = { id: string; label: string; color: string; metalness: number; roughness: number };

const FINISHES: Finish[] = [
  { id: "cyan", label: "Cyan gloss", color: "#38bdf8", metalness: 0.6, roughness: 0.15 },
  { id: "graphite", label: "Graphite matte", color: "#334155", metalness: 0.2, roughness: 0.8 },
  { id: "gold", label: "Brushed gold", color: "#eab308", metalness: 0.9, roughness: 0.3 },
];

function ConfiguratorScene({ finish }: { finish: Finish }) {
  const { scene } = useThree();
  const groupRef = useRef<Group>(null);
  const dragState = useRef({ dragging: false, lastX: 0, velocityY: 0 });

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(finish.color),
        metalness: finish.metalness,
        roughness: finish.roughness,
      }),
    [],
  );

  // Update the existing material in place on finish change, instead of
  // re-creating it — avoids allocating (and needing to dispose) a new
  // MeshStandardMaterial on every swap.
  useEffect(() => {
    material.color.set(finish.color);
    material.metalness = finish.metalness;
    material.roughness = finish.roughness;
  }, [material, finish]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (dragState.current.dragging) {
      group.rotation.y += dragState.current.velocityY;
    } else {
      group.rotation.y += delta * 0.2;
    }
  });

  useEffect(() => {
    return () => {
      const disposedMaterials = new Set<Material>();
      const disposedTextures = new Set<Texture>();

      const disposeMaterial = (mat: Material) => {
        if (disposedMaterials.has(mat)) return;
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

  const onPointerDown = (event: { clientX: number }) => {
    dragState.current.dragging = true;
    dragState.current.lastX = event.clientX;
  };
  const onPointerMove = (event: { clientX: number }) => {
    if (!dragState.current.dragging) return;
    const deltaX = event.clientX - dragState.current.lastX;
    dragState.current.lastX = event.clientX;
    dragState.current.velocityY = deltaX * 0.01;
  };
  const onPointerUp = () => {
    dragState.current.dragging = false;
  };

  return (
    <group
      ref={groupRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOut={onPointerUp}
    >
      <mesh material={material}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
      </mesh>
    </group>
  );
}

export default function ProductConfigurator3d() {
  const [activeFinish, setActiveFinish] = useState(FINISHES[0]);

  return (
    <section className="relative h-screen w-full cursor-grab overflow-hidden bg-slate-950 active:cursor-grabbing">
      <Canvas className="absolute inset-0" camera={{ position: [0, 0, 5], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={2.4} />
        <ConfiguratorScene finish={activeFinish} />
      </Canvas>
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-3 rounded-full border border-slate-800 bg-slate-900/80 p-2 backdrop-blur-sm">
        {FINISHES.map((finish) => (
          <button
            key={finish.id}
            type="button"
            onClick={() => setActiveFinish(finish)}
            aria-label={finish.label}
            aria-pressed={activeFinish.id === finish.id}
            className={`h-8 w-8 rounded-full border-2 transition ${
              activeFinish.id === finish.id ? "border-white" : "border-transparent"
            }`}
            style={{ backgroundColor: finish.color }}
          />
        ))}
      </div>
    </section>
  );
}
