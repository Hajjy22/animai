"use client";

import { useState, useEffect } from "react";
import previews from "./previews";

function FpsOverlay() {
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let acc = 0;

    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      frames += 1;
      acc += delta;
      if (acc >= 500) {
        setFps(Math.round((frames * 1000) / acc));
        frames = 0;
        acc = 0;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute top-3 right-3 z-20 rounded-md bg-slate-950/80 px-2.5 py-1 font-mono text-xs tabular-nums text-emerald-400 backdrop-blur-sm">
      {fps ?? "…"} fps
    </div>
  );
}

export function LivePreviewPanel({ id }: { id: string }) {
  const [mounted, setMounted] = useState(true);
  const Preview = previews[id];

  if (!Preview) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-500">
        No preview available for this component.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-400">
          Live preview
        </h2>
        <button
          onClick={() => setMounted((m) => !m)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            mounted
              ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          {mounted ? "Unmount" : "Mount"}
        </button>
      </div>
      {/* h-screen components center their content at ~50vh, so the panel must
          be viewport-relative or that content gets cropped on tall screens. */}
      <div
        className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
        style={{ height: "80vh", minHeight: "24rem" }}
      >
        {mounted ? (
          <>
            <FpsOverlay />
            <div className="absolute inset-0">
              <Preview />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Component unmounted — GPU resources disposed.
          </div>
        )}
      </div>
    </div>
  );
}
