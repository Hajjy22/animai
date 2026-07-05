"use client";

import dynamic from "next/dynamic";

const ProductOrbitViewer = dynamic(() => import("./ProductOrbitViewer"), { ssr: false });

export function ProductOrbitViewerSlot() {
  return <ProductOrbitViewer />;
}
