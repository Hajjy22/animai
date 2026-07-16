"use client";

import dynamic from "next/dynamic";

const InfiniteShaderCarousel = dynamic(() => import("./InfiniteShaderCarousel"), { ssr: false });

export function InfiniteShaderCarouselSlot() {
  return <InfiniteShaderCarousel />;
}
