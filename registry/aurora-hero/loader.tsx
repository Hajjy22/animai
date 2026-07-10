"use client";

import dynamic from "next/dynamic";

const AuroraHero = dynamic(() => import("./AuroraHero"), { ssr: false });

export function AuroraHeroSlot() {
  return <AuroraHero />;
}
