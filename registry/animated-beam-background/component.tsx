"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const NODES = [
  { x: 60, y: 200 },
  { x: 260, y: 80 },
  { x: 260, y: 320 },
  { x: 460, y: 200 },
];

const BEAMS = [
  "M60,200 C160,200 160,80 260,80",
  "M60,200 C160,200 160,320 260,320",
  "M260,80 C360,80 360,200 460,200",
  "M260,320 C360,320 360,200 460,200",
];

export default function AnimatedBeamBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const paths = gsap.utils.toArray<SVGPathElement>("[data-beam]");
      paths.forEach((path, index) => {
        gsap.to(path, {
          strokeDashoffset: -32,
          duration: 1.4,
          repeat: -1,
          ease: "none",
          delay: index * 0.25,
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950"
    >
      <svg viewBox="0 0 520 400" className="h-full w-full max-w-3xl" fill="none">
        {BEAMS.map((d, index) => (
          <path
            key={index}
            data-beam
            d={d}
            stroke="#38bdf8"
            strokeOpacity={0.5}
            strokeWidth={2}
            strokeDasharray="10 6"
            strokeDashoffset={0}
          />
        ))}
        {NODES.map((node, index) => (
          <circle key={index} cx={node.x} cy={node.y} r={7} fill="#0f172a" stroke="#38bdf8" strokeWidth={2} />
        ))}
      </svg>
      <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">Every system, wired together.</h2>
      </div>
    </section>
  );
}
