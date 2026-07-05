"use client";

import dynamic from "next/dynamic";

const AnimAIParticleFieldBackground = dynamic(
  () => import("./AnimAIParticleFieldBackground"),
  { ssr: false },
);

export function AnimAIParticleFieldBackgroundSlot() {
  return <AnimAIParticleFieldBackground />;
}
