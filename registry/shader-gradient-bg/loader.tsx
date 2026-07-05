"use client";

import dynamic from "next/dynamic";

const ShaderGradientBg = dynamic(() => import("./ShaderGradientBg"), { ssr: false });

export function ShaderGradientBgSlot() {
  return <ShaderGradientBg />;
}
