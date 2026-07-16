"use client";

import dynamic from "next/dynamic";

const ExplodedViewScroll = dynamic(() => import("./ExplodedViewScroll"), { ssr: false });

export function ExplodedViewScrollSlot() {
  return <ExplodedViewScroll />;
}
