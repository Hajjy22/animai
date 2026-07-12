"use client";

import { useEffect, useId, useRef, useState } from "react";

// Preview note: the overlay is positioned `absolute` inside this demo section so
// it stays within the bounded preview. In your app, switch `.md-overlay` to
// `position: fixed` to cover the whole viewport.
export default function ModalDialog() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      } else if (event.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <section className="relative flex min-h-[24rem] w-full items-center justify-center overflow-hidden bg-slate-950 p-8">
      <button ref={triggerRef} type="button" className="md-open" onClick={() => setOpen(true)}>
        Open dialog
      </button>

      {open && (
        <div className="md-overlay" role="presentation" onClick={() => setOpen(false)}>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="md-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="md-title">
              Delete project?
            </h2>
            <p className="md-body">
              This permanently removes the project and all of its data. This action cannot
              be undone.
            </p>
            <div className="md-actions">
              <button type="button" className="md-btn md-btn--ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className="md-btn md-btn--danger" onClick={() => setOpen(false)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .md-open {
          border-radius: var(--ai-radius, 0.5rem);
          background: var(--ai-primary, #0ea5e9);
          color: var(--ai-primary-fg, #ffffff);
          padding: 0.55rem 1rem;
          font-size: var(--ai-text-sm, 0.875rem);
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .md-open:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: 2px;
        }
        .md-overlay {
          position: absolute;
          inset: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(2, 6, 23, 0.6);
          backdrop-filter: blur(2px);
          animation: md-fade var(--ai-duration, 200ms) var(--ai-ease, ease);
        }
        .md-panel {
          width: 100%;
          max-width: 22rem;
          border-radius: var(--ai-radius-lg, 0.75rem);
          border: 1px solid var(--ai-border, #1e293b);
          background: var(--ai-surface, #0f172a);
          box-shadow: var(--ai-shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.6));
          padding: var(--ai-space-6, 1.5rem);
          animation: md-pop var(--ai-duration, 200ms) var(--ai-ease-out, cubic-bezier(0.16, 1, 0.3, 1));
        }
        .md-title {
          font-size: var(--ai-text-lg, 1.125rem);
          font-weight: 600;
          color: var(--ai-text, #e2e8f0);
        }
        .md-body {
          margin-top: var(--ai-space-2, 0.5rem);
          font-size: var(--ai-text-sm, 0.875rem);
          color: var(--ai-text-muted, #94a3b8);
          line-height: 1.5;
        }
        .md-actions {
          margin-top: var(--ai-space-6, 1.5rem);
          display: flex;
          justify-content: flex-end;
          gap: var(--ai-space-2, 0.5rem);
        }
        .md-btn {
          border-radius: var(--ai-radius, 0.5rem);
          padding: 0.45rem 0.85rem;
          font-size: var(--ai-text-sm, 0.875rem);
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .md-btn:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: 2px;
        }
        .md-btn--ghost {
          background: transparent;
          color: var(--ai-text, #e2e8f0);
          border-color: var(--ai-border, #334155);
        }
        .md-btn--danger {
          background: var(--ai-danger, #ef4444);
          color: var(--ai-danger-fg, #ffffff);
        }
        @keyframes md-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes md-pop {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .md-overlay,
          .md-panel {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
