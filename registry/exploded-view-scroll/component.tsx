"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Color, Group, MeshStandardMaterial } from "three";
import type { Material, Mesh, Object3D, Texture } from "three";

gsap.registerPlugin(ScrollTrigger);

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value && typeof value === "object" && "isTexture" in value && "dispose" in value,
  );
}

// A layered "device" assembled at the origin; each layer flies apart along Y as
// the section scrolls, then reassembles on scroll-up. Parts are thin rounded
// boxes with distinct token-ish accent colors.
const LAYERS = [
  { color: "#1e293b", assembledY: -0.6, explodedY: -2.2, size: [3, 0.28, 2] as const },
  { color: "#334155", assembledY: -0.3, explodedY: -1.0, size: [2.7, 0.18, 1.8] as const },
  { color: "#0ea5e9", assembledY: 0.0, explodedY: 0.1, size: [2.4, 0.14, 1.6] as const },
  { color: "#38bdf8", assembledY: 0.3, explodedY: 1.2, size: [2.6, 0.12, 1.7] as const },
  { color: "#e2e8f0", assembledY: 0.55, explodedY: 2.4, size: [2.9, 0.1, 1.95] as const },
];

function ExplodedScene({ triggerEl }: { triggerEl: HTMLElement | null }) {
  const { scene } = useThree();
  const groupRef = useRef<Group>(null);
  const partRefs = useRef<(Mesh | null)[]>([]);

  const materials = useMemo(
    () =>
      LAYERS.map(
        (layer) =>
          new MeshStandardMaterial({
            color: new Color(layer.color),
            metalness: 0.5,
            roughness: 0.35,
          }),
      ),
    [],
  );

  useGSAP(
    () => {
      if (!triggerEl || !groupRef.current) return;

      // Slow turntable spin across the whole scroll.
      gsap.to(groupRef.current.rotation, {
        y: Math.PI * 1.2,
        ease: "none",
        scrollTrigger: { trigger: triggerEl, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });

      // Each layer separates toward its exploded Y.
      LAYERS.forEach((layer, index) => {
        const part = partRefs.current[index];
        if (!part) return;
        gsap.fromTo(
          part.position,
          { y: layer.assembledY },
          {
            y: layer.explodedY,
            ease: "power1.inOut",
            scrollTrigger: { trigger: triggerEl, start: "top top", end: "bottom bottom", scrub: 0.6 },
          },
        );
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
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach(disposeMaterial);
        else if (mesh.material) disposeMaterial(mesh.material);
      });
    };
  }, [scene]);

  return (
    <group ref={groupRef} rotation={[0.5, 0, 0]}>
      {LAYERS.map((layer, index) => (
        <mesh
          key={index}
          ref={(el) => {
            partRefs.current[index] = el;
          }}
          material={materials[index]}
          position={[0, layer.assembledY, 0]}
        >
          <boxGeometry args={layer.size} />
        </mesh>
      ))}
    </group>
  );
}

export default function ExplodedViewScroll() {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  return (
    <div ref={setContainerEl} className="relative h-[300vh] w-full bg-slate-950">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <Canvas className="absolute inset-0" camera={{ position: [0, 0, 7], fov: 42 }} dpr={[1, 2]}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 4]} intensity={2.2} />
          <directionalLight position={[-4, -2, -3]} intensity={0.6} color="#38bdf8" />
          <ExplodedScene triggerEl={containerEl} />
        </Canvas>
        <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
          <p className="text-sm uppercase tracking-widest text-slate-400">Scroll to disassemble</p>
        </div>
      </div>
    </div>
  );
}
