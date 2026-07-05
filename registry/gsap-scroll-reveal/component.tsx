"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function AnimAIScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal-item]");
      items.forEach((item) => {
        gsap.fromTo(
          item,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: item,
              start: "top 80%",
            },
          },
        );
      });
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-slate-950 px-6 py-24 text-white"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <h2 data-reveal-item className="text-4xl font-semibold">
          Built for motion that respects the scroll.
        </h2>
        <p data-reveal-item className="text-lg text-slate-300">
          Each section reveals itself once it enters the viewport, using a
          single ScrollTrigger-driven timeline.
        </p>
        <p data-reveal-item className="text-lg text-slate-300">
          No manual cleanup required: useGSAP() reverts every tween and
          ScrollTrigger instance when the component unmounts, including React
          18 Strict Mode&apos;s double-invoke.
        </p>
      </div>
    </section>
  );
}
