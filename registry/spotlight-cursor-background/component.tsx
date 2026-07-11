"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function SpotlightCursorBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  useEffect(() => {
    const container = containerRef.current;
    const spotlight = spotlightRef.current;
    if (!container || !spotlight) {
      return;
    }

    const quickX = contextSafe(() =>
      gsap.quickTo(spotlight, "--spot-x", { duration: 0.6, ease: "power3" }),
    )() as (value: number) => void;
    const quickY = contextSafe(() =>
      gsap.quickTo(spotlight, "--spot-y", { duration: 0.6, ease: "power3" }),
    )() as (value: number) => void;

    const onPointerMove = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      quickX(((event.clientX - bounds.left) / bounds.width) * 100);
      quickY(((event.clientY - bounds.top) / bounds.height) * 100);
    };
    const onPointerEnter = contextSafe(() => {
      gsap.to(spotlight, { autoAlpha: 1, duration: 0.3 });
    });
    const onPointerLeave = contextSafe(() => {
      gsap.to(spotlight, { autoAlpha: 0, duration: 0.3 });
    });

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerenter", onPointerEnter);
    container.addEventListener("pointerleave", onPointerLeave);

    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerenter", onPointerEnter);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [contextSafe]);

  return (
    <section
      ref={containerRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950"
    >
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 opacity-0"
        style={
          {
            "--spot-x": "50",
            "--spot-y": "50",
            background:
              "radial-gradient(circle at calc(var(--spot-x) * 1%) calc(var(--spot-y) * 1%), rgba(56,189,248,0.18) 0%, rgba(2,6,23,0) 35%)",
          } as React.CSSProperties
        }
      />
      <div className="relative z-10 max-w-lg px-6 text-center">
        <h2 className="text-4xl font-semibold text-white sm:text-5xl">Follow the light.</h2>
        <p className="mt-4 text-slate-400">
          A soft spotlight tracks the pointer across the full section — every
          listener is removed on unmount.
        </p>
      </div>
    </section>
  );
}
