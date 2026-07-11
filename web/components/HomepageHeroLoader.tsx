"use client";

import dynamic from "next/dynamic";

const HomepageHero = dynamic(() => import("./HomepageHero"), { ssr: false });

export function HomepageHeroLoader() {
  return <HomepageHero />;
}
