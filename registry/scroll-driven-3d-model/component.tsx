"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Color, MeshStandardMaterial } from "three";
import type { Material, Mesh, Object3D, Texture } from "three";

gsap.registerPlugin(ScrollTrigger);

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value &&
      typeof value === "object" &&
      "isTexture" in value &&
      "dispose" in value,
  );
}

function ScrollDrivenScene({ triggerEl }: { triggerEl: HTMLElement | null }) {
  const { scene } = useThree();
  const meshRef = useRef<Mesh>(null);

  const material = useMemo(
    () => new MeshStandardMaterial({ color: new Color("#38bdf8"), metalness: 0.4, roughness: 0.3 }),
    [],
  );

  useGSAP(
    () => {
      const mesh = meshRef.current;
      if (!mesh || !triggerEl) return;

      gsap.to(mesh.rotation, {
        y: Math.PI * 2,
        x: Math.PI * 0.5,
        ease: "none",
        scrollTrigger: {
          trigger: triggerEl,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
        },
      });
      gsap.to(mesh.position, {
        x: 1.2,
        ease: "none",
        scrollTrigger: {
          trigger: triggerEl,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
        },
      });
    },
    { dependencies: [triggerEl] },
  );

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

  return (
    <mesh ref={meshRef} material={material}>
      <torusKnotGeometry args={[0.9, 0.28, 128, 24]} />
    </mesh>
  );
}

export default function ScrollDriven3dModel() {
  // A plain useRef's `.current` is null during the render that creates the
  // element — nothing re-renders once it attaches, so a child reading it via
  // props would be stuck with null forever. State-backed callback ref forces
  // the re-render once the DOM node actually exists.
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  return (
    <div ref={setContainerEl} className="relative h-[250vh] w-full bg-slate-950">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <Canvas className="absolute inset-0" camera={{ position: [0, 0, 5], fov: 42 }} dpr={[1, 2]}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 4, 5]} intensity={2} />
          <ScrollDrivenScene triggerEl={containerEl} />
        </Canvas>
        <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
          <p className="text-sm uppercase tracking-widest text-slate-400">Scroll to reveal</p>
        </div>
      </div>
    </div>
  );
}
