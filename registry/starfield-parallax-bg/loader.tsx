"use client";

import dynamic from "next/dynamic";

const StarfieldParallaxBg = dynamic(() => import("./StarfieldParallaxBg"), { ssr: false });

export function StarfieldParallaxBgSlot() {
  return <StarfieldParallaxBg />;
}
