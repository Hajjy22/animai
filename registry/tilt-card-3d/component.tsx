"use client";

import { useRef } from "react";

export default function TiltCard3d() {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.setProperty("--rotate-x", `${(-y * 16).toFixed(2)}deg`);
    card.style.setProperty("--rotate-y", `${(x * 16).toFixed(2)}deg`);
  };

  const handlePointerLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--rotate-x", "0deg");
    card.style.setProperty("--rotate-y", "0deg");
  };

  return (
    <section className="flex h-screen w-full items-center justify-center bg-slate-950 px-6">
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="tilt-card relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-8"
        style={{ "--rotate-x": "0deg", "--rotate-y": "0deg" } as React.CSSProperties}
      >
        <div className="tilt-card-content">
          <h3 className="text-xl font-semibold text-white">Ship with confidence</h3>
          <p className="mt-2 text-sm text-slate-400">
            Move your pointer across this card — the tilt follows in real 3D,
            no Three.js required.
          </p>
        </div>
      </div>
      <style>{`
        .tilt-card {
          transform-style: preserve-3d;
          transform: perspective(800px) rotateX(var(--rotate-x)) rotateY(var(--rotate-y));
          transition: transform 0.4s ease;
        }
        .tilt-card:hover {
          transition: transform 0.05s linear;
        }
        .tilt-card-content {
          transform: translateZ(24px);
        }
        @media (prefers-reduced-motion: reduce) {
          .tilt-card {
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}
