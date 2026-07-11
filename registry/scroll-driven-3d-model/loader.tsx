"use client";

import dynamic from "next/dynamic";

const ScrollDriven3dModel = dynamic(() => import("./ScrollDriven3dModel"), { ssr: false });

export function ScrollDriven3dModelSlot() {
  return <ScrollDriven3dModel />;
}
