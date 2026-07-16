"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, Color, Group, MeshStandardMaterial } from "three";
import type { Material, Mesh, Object3D, Texture } from "three";

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value && typeof value === "object" && "isTexture" in value && "dispose" in value,
  );
}

// Procedural "app screenshot" drawn to an offscreen canvas — asset-free. In
// your app, swap this for a TextureLoader on your own screenshot URL and
// dispose it the same way.
function createScreenTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#0b1120";
    ctx.fillRect(0, 0, 1024, 640);
    // top bar
    ctx.fillStyle = "#111a2e";
    ctx.fillRect(0, 0, 1024, 64);
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(40, 32, 12, 0, Math.PI * 2);
    ctx.fill();
    // sidebar
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 64, 220, 576);
    ctx.fillStyle = "#1e293b";
    for (let i = 0; i < 5; i += 1) ctx.fillRect(28, 110 + i * 54, 164, 30);
    // hero cards
    const grad = ctx.createLinearGradient(260, 100, 980, 400);
    grad.addColorStop(0, "#0ea5e9");
    grad.addColorStop(1, "#7c3aed");
    ctx.fillStyle = grad;
    ctx.fillRect(260, 100, 720, 180);
    ctx.fillStyle = "#111a2e";
    ctx.fillRect(260, 310, 340, 250);
    ctx.fillRect(640, 310, 340, 250);
    // fake chart bars
    ctx.fillStyle = "#38bdf8";
    for (let i = 0; i < 7; i += 1) ctx.fillRect(680 + i * 40, 520 - (i % 4) * 40, 24, (i % 4) * 40 + 20);
  }
  return new CanvasTexture(canvas);
}

function Laptop() {
  const { scene } = useThree();
  const groupRef = useRef<Group>(null);
  const drag = useRef({ active: false, lastX: 0, vel: 0 });

  const screenTexture = useMemo(() => createScreenTexture(), []);
  const bodyMat = useMemo(
    () => new MeshStandardMaterial({ color: new Color("#cbd5e1"), metalness: 0.8, roughness: 0.35 }),
    [],
  );
  const bezelMat = useMemo(
    () => new MeshStandardMaterial({ color: new Color("#0b1120"), metalness: 0.5, roughness: 0.5 }),
    [],
  );
  const screenMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: screenTexture,
        emissiveMap: screenTexture,
        emissive: new Color("#ffffff"),
        emissiveIntensity: 0.55,
        roughness: 0.25,
      }),
    [screenTexture],
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (drag.current.active) {
      group.rotation.y += drag.current.vel;
      drag.current.vel *= 0.9;
    } else {
      // Gentle oscillation around a front-facing 3/4 angle so the lit screen
      // stays toward the viewer instead of spinning fully away.
      group.rotation.y = -0.35 + Math.sin(state.clock.elapsedTime * 0.35) * 0.5;
    }
    // subtle idle float
    group.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
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
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach(disposeMaterial);
        else if (mesh.material) disposeMaterial(mesh.material);
      });
    };
  }, [scene]);

  const onDown = (e: { clientX: number }) => {
    drag.current.active = true;
    drag.current.lastX = e.clientX;
  };
  const onMove = (e: { clientX: number }) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.lastX;
    drag.current.lastX = e.clientX;
    drag.current.vel = dx * 0.008;
  };
  const onUp = () => {
    drag.current.active = false;
  };

  return (
    // Outer group: idle float + turntable + drag. Inner group: a static
    // offset that lifts the whole device so the open screen sits near the
    // view center (the camera aims at the origin).
    <group ref={groupRef} scale={0.82} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerOut={onUp}>
      <group position={[0, -0.6, 0]} rotation={[0, 0, 0]}>
        {/* base */}
        <mesh material={bodyMat} position={[0, -0.5, 0]}>
          <boxGeometry args={[4, 0.16, 2.6]} />
        </mesh>
        {/* screen lid, hinged at the back edge, opened ~20° back from vertical */}
        <group position={[0, -0.42, -1.25]} rotation={[-0.35, 0, 0]}>
          <mesh material={bezelMat} position={[0, 1.35, 0]}>
            <boxGeometry args={[4, 2.7, 0.12]} />
          </mesh>
          <mesh material={screenMat} position={[0, 1.35, 0.07]}>
            <planeGeometry args={[3.7, 2.4]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function DeviceShowcase3d() {
  return (
    <section className="relative h-screen w-full cursor-grab overflow-hidden bg-slate-950 active:cursor-grabbing">
      <Canvas className="absolute inset-0" camera={{ position: [0, 0.25, 8], fov: 36 }} dpr={[1, 2]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} />
        <directionalLight position={[-5, 2, 3]} intensity={0.7} color="#38bdf8" />
        <Laptop />
      </Canvas>
    </section>
  );
}
