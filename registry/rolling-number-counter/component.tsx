"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

type Stat = { id: string; label: string; value: number; suffix?: string };

const STATS: Stat[] = [
  { id: "installs", label: "Installs", value: 48210, suffix: "+" },
  { id: "uptime", label: "Uptime", value: 99, suffix: "%" },
  { id: "components", label: "Components", value: 30 },
];

export default function RollingNumberCounter() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const nodes = gsap.utils.toArray<HTMLElement>("[data-stat-value]");
      nodes.forEach((node) => {
        const target = Number(node.dataset.statValue ?? "0");
        const proxy = { value: 0 };
        gsap.to(proxy, {
          value: target,
          duration: 1.6,
          ease: "power2.out",
          snap: { value: 1 },
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
          },
          onUpdate: () => {
            node.textContent = Math.round(proxy.value).toLocaleString("en-US");
          },
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="flex w-full flex-wrap items-center justify-center gap-12 overflow-hidden bg-slate-950 px-6 py-24 text-white"
    >
      {STATS.map((stat) => (
        <div key={stat.id} className="flex flex-col items-center gap-1">
          <div className="flex items-baseline font-mono text-5xl font-bold tabular-nums text-sky-300 sm:text-6xl">
            <span data-stat-value={stat.value}>0</span>
            {stat.suffix ? <span>{stat.suffix}</span> : null}
          </div>
          <p className="text-sm uppercase tracking-widest text-slate-400">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}
