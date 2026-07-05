"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function MagneticCursorGlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  useEffect(() => {
    const container = containerRef.current;
    const glow = glowRef.current;
    if (!container || !glow) {
      return;
    }

    const moveGlow = contextSafe(() => {
      const quickX = gsap.quickTo(glow, "x", { duration: 0.5, ease: "power3" });
      const quickY = gsap.quickTo(glow, "y", { duration: 0.5, ease: "power3" });
      return { quickX, quickY };
    });
    const { quickX, quickY } = moveGlow() as { quickX: (v: number) => void; quickY: (v: number) => void };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      quickX(event.clientX - bounds.left);
      quickY(event.clientY - bounds.top);
    };
    const onPointerEnter = contextSafe(() => {
      gsap.to(glow, { autoAlpha: 1, duration: 0.3 });
    });
    const onPointerLeave = contextSafe(() => {
      gsap.to(glow, { autoAlpha: 0, duration: 0.3 });
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
      className="relative flex h-[28rem] w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950"
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute -left-32 -top-32 h-64 w-64 rounded-full opacity-0"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(56,189,248,0) 70%)",
        }}
      />
      <p className="relative z-10 max-w-sm text-center text-slate-300">
        Move your pointer over this panel. The glow follows with GSAP{" "}
        <code className="text-sky-300">quickTo()</code> easing, and every
        listener is removed on unmount — nothing keeps running after the
        component is gone.
      </p>
    </section>
  );
}
