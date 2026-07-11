"use client";

import dynamic from "next/dynamic";

const ProductConfigurator3d = dynamic(() => import("./ProductConfigurator3d"), { ssr: false });

export function ProductConfigurator3dSlot() {
  return <ProductConfigurator3d />;
}
