"use client";

import dynamic from "next/dynamic";

const LiquidImageHover = dynamic(() => import("./LiquidImageHover"), { ssr: false });

export function LiquidImageHoverSlot() {
  return <LiquidImageHover />;
}
