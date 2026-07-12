"use client";

import { useRef, useState } from "react";

type Toast = { id: number; title: string; tone: "success" | "info" | "error" };

const SAMPLES: Omit<Toast, "id">[] = [
  { title: "Changes saved", tone: "success" },
  { title: "New comment on your post", tone: "info" },
  { title: "Upload failed — retry?", tone: "error" },
];

export default function ToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const sampleIndex = useRef(0);

  const dismiss = (id: number) => setToasts((current) => current.filter((t) => t.id !== id));

  const push = () => {
    const sample = SAMPLES[sampleIndex.current % SAMPLES.length];
    sampleIndex.current += 1;
    const id = nextId.current++;
    setToasts((current) => [...current, { id, ...sample }]);
    window.setTimeout(() => dismiss(id), 4000);
  };

  return (
    <section className="relative flex min-h-[24rem] w-full items-center justify-center overflow-hidden bg-slate-950 p-8">
      <button type="button" className="tst-trigger" onClick={push}>
        Show a toast
      </button>

      {/* aria-live so screen readers announce new toasts as they arrive */}
      <div className="tst-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="tst-toast" data-tone={toast.tone}>
            <span className="tst-dot" aria-hidden />
            <span className="tst-title">{toast.title}</span>
            <button
              type="button"
              className="tst-close"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .tst-trigger {
          border-radius: var(--ai-radius, 0.5rem);
          background: var(--ai-primary, #0ea5e9);
          color: var(--ai-primary-fg, #ffffff);
          padding: 0.55rem 1rem;
          font-size: var(--ai-text-sm, 0.875rem);
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .tst-trigger:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: 2px;
        }
        .tst-region {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 30;
          display: flex;
          flex-direction: column;
          gap: var(--ai-space-2, 0.5rem);
          width: min(18rem, calc(100% - 2rem));
        }
        .tst-toast {
          display: flex;
          align-items: center;
          gap: var(--ai-space-3, 0.75rem);
          border-radius: var(--ai-radius, 0.5rem);
          border: 1px solid var(--ai-border, #1e293b);
          background: var(--ai-surface, #0f172a);
          box-shadow: var(--ai-shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.5));
          padding: 0.7rem 0.8rem;
          animation: tst-in var(--ai-duration-slow, 320ms) var(--ai-ease-out, cubic-bezier(0.16, 1, 0.3, 1));
        }
        .tst-dot {
          width: 0.55rem;
          height: 0.55rem;
          border-radius: 9999px;
          flex-shrink: 0;
          background: var(--ai-text-muted, #94a3b8);
        }
        .tst-toast[data-tone="success"] .tst-dot { background: var(--ai-success, #10b981); }
        .tst-toast[data-tone="info"] .tst-dot { background: var(--ai-primary, #38bdf8); }
        .tst-toast[data-tone="error"] .tst-dot { background: var(--ai-danger, #ef4444); }
        .tst-title {
          flex: 1;
          font-size: var(--ai-text-sm, 0.875rem);
          color: var(--ai-text, #e2e8f0);
        }
        .tst-close {
          display: inline-flex;
          flex-shrink: 0;
          padding: 0.15rem;
          border: none;
          background: transparent;
          color: var(--ai-text-muted, #94a3b8);
          cursor: pointer;
          border-radius: var(--ai-radius-sm, 0.375rem);
        }
        .tst-close svg { width: 1rem; height: 1rem; }
        .tst-close:hover { color: var(--ai-text, #e2e8f0); }
        .tst-close:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: 1px;
        }
        @keyframes tst-in {
          from { opacity: 0; transform: translateX(1rem) scale(0.98); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tst-toast { animation: none; }
        }
      `}</style>
    </section>
  );
}
