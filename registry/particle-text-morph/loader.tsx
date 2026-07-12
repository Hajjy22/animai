"use client";

import dynamic from "next/dynamic";

const ParticleTextMorph = dynamic(() => import("./ParticleTextMorph"), { ssr: false });

export function ParticleTextMorphSlot() {
  return <ParticleTextMorph />;
}
