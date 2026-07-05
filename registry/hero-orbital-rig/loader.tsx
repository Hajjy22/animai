"use client";

import dynamic from "next/dynamic";

const AnimAIMotionHero = dynamic(() => import("./AnimAIMotionHero"), {
  ssr: false,
});

export function AnimAIMotionHeroSlot() {
  return <AnimAIMotionHero />;
}
