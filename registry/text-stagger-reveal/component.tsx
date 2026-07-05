"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const HEADLINE = "Motion that ships production-ready.";

export default function TextStaggerReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.set("[data-word]", { autoAlpha: 0, y: 24 });
      gsap.to("[data-word]", {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.06,
        delay: 0.1,
      });
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="flex w-full flex-col items-start gap-4 bg-slate-950 px-6 py-24 text-white"
    >
      <h2 className="flex flex-wrap gap-x-3 gap-y-1 text-4xl font-semibold sm:text-5xl">
        {HEADLINE.split(" ").map((word, index) => (
          <span key={`${word}-${index}`} className="inline-block overflow-hidden">
            <span data-word className="inline-block">
              {word}
            </span>
          </span>
        ))}
      </h2>
      <p className="max-w-xl text-slate-300">
        Each word is its own GSAP tween, staggered on mount. useGSAP() scopes
        and reverts the timeline automatically, so remounts under React 18
        Strict Mode never double-fire or leak tweens.
      </p>
    </section>
  );
}
