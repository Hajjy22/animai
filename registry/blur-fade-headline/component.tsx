"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function BlurFadeHeadline() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-blur-reveal]",
        { autoAlpha: 0, y: 24, filter: "blur(14px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="flex w-full flex-col items-center justify-center gap-4 overflow-hidden bg-slate-950 px-6 py-24 text-center text-white"
    >
      <h2 data-blur-reveal className="max-w-2xl text-4xl font-semibold sm:text-5xl">
        Clarity arrives one scroll at a time.
      </h2>
      <p data-blur-reveal className="max-w-xl text-lg text-slate-300">
        Headlines resolve out of a soft blur as they enter the viewport — a
        single ScrollTrigger-driven tween, reverted cleanly on unmount.
      </p>
    </section>
  );
}
