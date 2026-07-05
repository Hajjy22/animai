"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A self-contained live FPS meter driving a small animated canvas. It measures
 * real frame times via requestAnimationFrame — the same signal the runtime
 * vetting tier uses to produce `measured_fps`. (The full runtime harness also
 * reads three's renderer.info for VRAM counts; this widget is the honest,
 * dependency-free preview of the "we measure performance" claim.)
 */
export function FpsMeter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    let angle = 0;

    const render = (now: number) => {
      const delta = now - last;
      last = now;
      frames += 1;
      acc += delta;
      if (acc >= 500) {
        setFps(Math.round((frames * 1000) / acc));
        frames = 0;
        acc = 0;
      }

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);
      angle += delta * 0.0016;
      for (let i = 0; i < 3; i += 1) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.arc(48, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(56,189,248,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-5">
      <canvas
        ref={canvasRef}
        width={140}
        height={140}
        className="rounded-lg bg-slate-900"
      />
      <div>
        <div className="text-3xl font-semibold tabular-nums text-white">
          {fps ?? "…"} <span className="text-base text-slate-400">fps</span>
        </div>
        <p className="mt-1 max-w-xs text-sm text-slate-400">
          Live frame-time measurement. The runtime vetting tier records this per
          component and asserts GPU resources return to baseline after unmount.
        </p>
      </div>
    </div>
  );
}
