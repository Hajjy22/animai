"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

type Row = { feature: string; free: boolean; pro: boolean };

const ROWS: Row[] = [
  { feature: "CLI & MCP server", free: true, pro: true },
  { feature: "Vetted free components", free: true, pro: true },
  { feature: "All Pro components", free: false, pro: true },
  { feature: "Priority updates", free: false, pro: true },
  { feature: "Commercial license", free: false, pro: true },
];

function Mark({ included }: { included: boolean }) {
  return included ? (
    <span className="text-emerald-400">&#10003;</span>
  ) : (
    <span className="text-slate-600">&#10005;</span>
  );
}

export default function FeatureComparisonTable() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-row]", {
        autoAlpha: 0,
        y: 16,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
      });
    },
    { scope: containerRef },
  );

  return (
    <section ref={containerRef} className="w-full bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-slate-800">
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-900/80 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          <span>Feature</span>
          <span className="text-center">Free</span>
          <span className="text-center">Pro</span>
        </div>
        {ROWS.map((row) => (
          <div
            key={row.feature}
            data-row
            className="grid grid-cols-3 border-b border-slate-800/60 px-6 py-4 text-sm last:border-b-0"
          >
            <span className="text-slate-200">{row.feature}</span>
            <span className="text-center">
              <Mark included={row.free} />
            </span>
            <span className="text-center">
              <Mark included={row.pro} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
