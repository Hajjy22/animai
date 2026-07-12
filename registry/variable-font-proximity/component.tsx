"use client";

import { useEffect, useRef } from "react";

const HEADLINE = "LIQUID TYPE";
const MIN_WEIGHT = 300;
const MAX_WEIGHT = 900;
const RADIUS_PX = 220;

// Liquid typography: each letter's font weight follows the cursor via
// variable-font axes ('wght'). Uses the system variable font stack (Segoe UI
// Variable, SF Pro) — on non-variable fonts, weights snap gracefully.
export default function VariableFontProximity() {
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pointer = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
    };
    const onPointerLeave = () => {
      pointer.current.x = -9999;
      pointer.current.y = -9999;
    };
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    let raf = 0;
    const tick = () => {
      // Read all rects first, then write all styles — avoids layout thrash.
      const rects = letterRefs.current.map((el) => el?.getBoundingClientRect());
      rects.forEach((rect, index) => {
        const el = letterRefs.current[index];
        if (!el || !rect) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(pointer.current.x - cx, pointer.current.y - cy);
        const closeness = Math.max(0, 1 - dist / RADIUS_PX);
        const weight = Math.round(MIN_WEIGHT + (MAX_WEIGHT - MIN_WEIGHT) * closeness);
        el.style.fontVariationSettings = `'wght' ${weight}`;
        el.style.fontWeight = String(weight);
        el.style.transform = `translateY(${(-4 * closeness).toFixed(1)}px)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950"
    >
      <h2 className="vfp-headline" aria-label={HEADLINE}>
        {HEADLINE.split("").map((char, index) => (
          <span
            key={index}
            ref={(el) => {
              letterRefs.current[index] = el;
            }}
            aria-hidden
            className="vfp-letter"
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </h2>
      <style>{`
        .vfp-headline {
          font-family: system-ui, -apple-system, "Segoe UI Variable", "Segoe UI", sans-serif;
          font-size: clamp(2.5rem, 9vw, 7rem);
          font-weight: ${MIN_WEIGHT};
          letter-spacing: 0.02em;
          color: #e2e8f0;
          cursor: default;
          user-select: none;
        }
        .vfp-letter {
          display: inline-block;
          transition: transform 120ms ease-out;
          will-change: font-variation-settings, transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .vfp-letter {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
