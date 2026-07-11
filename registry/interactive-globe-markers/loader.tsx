"use client";

import dynamic from "next/dynamic";

const InteractiveGlobeMarkers = dynamic(() => import("./InteractiveGlobeMarkers"), { ssr: false });

export function InteractiveGlobeMarkersSlot() {
  return <InteractiveGlobeMarkers />;
}
