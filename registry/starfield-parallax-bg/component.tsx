"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, Color, Float32BufferAttribute, PointsMaterial } from "three";
import type { Points } from "three";

type LayerConfig = { count: number; spread: number; size: number; parallax: number; color: string };

const LAYERS: LayerConfig[] = [
  { count: 600, spread: 14, size: 0.03, parallax: 0.6, color: "#e2e8f0" },
  { count: 500, spread: 22, size: 0.02, parallax: 0.3, color: "#94a3b8" },
  { count: 400, spread: 32, size: 0.014, parallax: 0.12, color: "#64748b" },
];

// Each layer is its own Points object with its own geometry/material, so
// cleanup disposes exactly those two references directly — no scene
// traversal needed (and traversing the whole scene here would re-dispose the
// sibling layers' resources too, since all three mount into one Canvas).
function StarLayer({ config }: { config: LayerConfig }) {
  const pointsRef = useRef<Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(config.count * 3);
    for (let i = 0; i < config.count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * config.spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * config.spread * 0.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geo;
  }, [config]);

  const material = useMemo(
    () =>
      new PointsMaterial({
        color: new Color(config.color),
        size: config.size,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
      }),
    [config],
  );

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.position.x = state.pointer.x * config.parallax;
    pointsRef.current.position.y = state.pointer.y * config.parallax * 0.6;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export default function StarfieldParallaxBg() {
  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-slate-950">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 2]}>
        {LAYERS.map((layer, index) => (
          <StarLayer key={index} config={layer} />
        ))}
      </Canvas>
    </div>
  );
}
