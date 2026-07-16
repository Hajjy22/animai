"use client";

import dynamic from "next/dynamic";

const DeviceShowcase3d = dynamic(() => import("./DeviceShowcase3d"), { ssr: false });

export function DeviceShowcase3dSlot() {
  return <DeviceShowcase3d />;
}
