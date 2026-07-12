"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function Popover() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <section className="relative flex min-h-[24rem] w-full items-center justify-center bg-slate-950 p-8">
      <div ref={rootRef} className="pv-root">
        <button
          type="button"
          className="pv-trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          Share
        </button>
        {open && (
          <div id={panelId} role="dialog" aria-label="Share options" className="pv-panel">
            <span className="pv-arrow" aria-hidden />
            <p className="pv-title">Share this page</p>
            <div className="pv-actions">
              <button type="button" className="pv-item">Copy link</button>
              <button type="button" className="pv-item">Email</button>
              <button type="button" className="pv-item">Embed</button>
            </div>
          </div>
        )}

        <style>{`
          .pv-root { position: relative; display: inline-block; }
          .pv-trigger {
            border-radius: var(--ai-radius, 0.5rem);
            background: var(--ai-surface-2, #1e293b);
            color: var(--ai-text, #e2e8f0);
            border: 1px solid var(--ai-border, #334155);
            padding: 0.5rem 0.9rem;
            font-size: var(--ai-text-sm, 0.875rem);
            font-weight: 600;
            cursor: pointer;
          }
          .pv-trigger:focus-visible {
            outline: 2px solid var(--ai-ring, #38bdf8);
            outline-offset: 2px;
          }
          .pv-panel {
            position: absolute;
            top: calc(100% + 0.6rem);
            left: 50%;
            transform: translateX(-50%);
            z-index: 20;
            width: 12rem;
            border-radius: var(--ai-radius, 0.5rem);
            border: 1px solid var(--ai-border, #1e293b);
            background: var(--ai-surface, #0f172a);
            box-shadow: var(--ai-shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.6));
            padding: var(--ai-space-3, 0.75rem);
            animation: pv-pop var(--ai-duration-fast, 150ms) var(--ai-ease-out, ease);
          }
          .pv-arrow {
            position: absolute;
            top: -0.35rem;
            left: 50%;
            transform: translateX(-50%) rotate(45deg);
            width: 0.7rem;
            height: 0.7rem;
            background: var(--ai-surface, #0f172a);
            border-left: 1px solid var(--ai-border, #1e293b);
            border-top: 1px solid var(--ai-border, #1e293b);
          }
          .pv-title {
            font-size: var(--ai-text-xs, 0.75rem);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--ai-text-muted, #94a3b8);
            margin-bottom: var(--ai-space-2, 0.5rem);
          }
          .pv-actions { display: flex; flex-direction: column; gap: 0.1rem; }
          .pv-item {
            text-align: left;
            border: none;
            background: transparent;
            color: var(--ai-text, #e2e8f0);
            font-size: var(--ai-text-sm, 0.875rem);
            padding: 0.4rem 0.5rem;
            border-radius: var(--ai-radius-sm, 0.375rem);
            cursor: pointer;
          }
          .pv-item:hover { background: var(--ai-surface-2, #1e293b); }
          .pv-item:focus-visible {
            outline: 2px solid var(--ai-ring, #38bdf8);
            outline-offset: -2px;
          }
          @keyframes pv-pop {
            from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .pv-panel { animation: none; }
          }
        `}</style>
      </div>
    </section>
  );
}
