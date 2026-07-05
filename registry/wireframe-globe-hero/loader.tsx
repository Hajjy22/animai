"use client";

import dynamic from "next/dynamic";

const WireframeGlobeHero = dynamic(() => import("./WireframeGlobeHero"), { ssr: false });

export function WireframeGlobeHeroSlot() {
  return <WireframeGlobeHero />;
}
