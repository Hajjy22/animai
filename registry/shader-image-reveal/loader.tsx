"use client";

import dynamic from "next/dynamic";

const ShaderImageReveal = dynamic(() => import("./ShaderImageReveal"), { ssr: false });

export function ShaderImageRevealSlot() {
  return <ShaderImageReveal />;
}
