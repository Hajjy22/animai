"use client";

import { useEffect, useId, useRef, useState } from "react";

// Preview note: positioned `absolute` within this demo. In your app, switch
// `.dp-overlay` / `.dp-panel` to `position: fixed` for an app-global drawer.
export default function DrawerPanel() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("button, [href], input")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <section className="relative flex min-h-[24rem] w-full items-center justify-center overflow-hidden bg-slate-950 p-8">
      <button ref={triggerRef} type="button" className="dp-open" onClick={() => setOpen(true)}>
        Open filters
      </button>

      {open && (
        <div className="dp-overlay" role="presentation" onClick={() => setOpen(false)}>
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="dp-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dp-head">
              <h2 id={titleId} className="dp-title">
                Filters
              </h2>
              <button type="button" className="dp-close" aria-label="Close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="dp-body">
              <p>Availability</p>
              <p>Price range</p>
              <p>Rating</p>
              <p>Brand</p>
            </div>
          </aside>
        </div>
      )}

      <style>{`
        .dp-open {
          border-radius: var(--ai-radius, 0.5rem);
          background: var(--ai-primary, #0ea5e9);
          color: var(--ai-primary-fg, #ffffff);
          padding: 0.55rem 1rem;
          font-size: var(--ai-text-sm, 0.875rem);
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .dp-open:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: 2px;
        }
        .dp-overlay {
          position: absolute;
          inset: 0;
          z-index: 30;
          background: rgba(2, 6, 23, 0.6);
          backdrop-filter: blur(2px);
          animation: dp-fade var(--ai-duration, 200ms) var(--ai-ease, ease);
        }
        .dp-panel {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(20rem, 85%);
          border-left: 1px solid var(--ai-border, #1e293b);
          background: var(--ai-surface, #0f172a);
          box-shadow: var(--ai-shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.6));
          padding: var(--ai-space-6, 1.5rem);
          animation: dp-slide var(--ai-duration-slow, 320ms) var(--ai-ease-out, cubic-bezier(0.16, 1, 0.3, 1));
        }
        .dp-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dp-title {
          font-size: var(--ai-text-lg, 1.125rem);
          font-weight: 600;
          color: var(--ai-text, #e2e8f0);
        }
        .dp-close {
          display: inline-flex;
          padding: 0.3rem;
          border-radius: var(--ai-radius-sm, 0.375rem);
          border: none;
          background: transparent;
          color: var(--ai-text-muted, #94a3b8);
          cursor: pointer;
        }
        .dp-close svg { width: 1.15rem; height: 1.15rem; }
        .dp-close:hover { color: var(--ai-text, #e2e8f0); }
        .dp-close:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: 2px;
        }
        .dp-body {
          margin-top: var(--ai-space-6, 1.5rem);
          display: flex;
          flex-direction: column;
          gap: var(--ai-space-4, 1rem);
          color: var(--ai-text-muted, #cbd5e1);
          font-size: var(--ai-text-sm, 0.875rem);
        }
        @keyframes dp-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dp-slide {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .dp-overlay,
          .dp-panel {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
