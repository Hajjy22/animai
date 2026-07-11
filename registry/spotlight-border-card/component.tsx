"use client";

import { useRef } from "react";

export default function SpotlightBorderCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    card.style.setProperty("--spot-x", `${x.toFixed(1)}%`);
    card.style.setProperty("--spot-y", `${y.toFixed(1)}%`);
  };

  return (
    <section className="flex h-screen w-full items-center justify-center bg-slate-950 px-6">
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        className="spotlight-border w-full max-w-sm rounded-2xl p-[1.5px]"
        style={{ "--spot-x": "50%", "--spot-y": "50%" } as React.CSSProperties}
      >
        <div className="rounded-[15px] bg-slate-900 p-8">
          <h3 className="text-xl font-semibold text-white">Every edge, alive.</h3>
          <p className="mt-2 text-sm text-slate-400">
            A spotlight travels the card&apos;s border as your pointer moves —
            pure CSS, no canvas.
          </p>
        </div>
      </div>
      <style>{`
        .spotlight-border {
          background: radial-gradient(
            220px circle at var(--spot-x) var(--spot-y),
            #38bdf8 0%,
            rgba(56, 189, 248, 0.15) 35%,
            rgba(30, 41, 59, 0.9) 60%
          );
          transition: background 0.15s ease;
        }
      `}</style>
    </section>
  );
}
