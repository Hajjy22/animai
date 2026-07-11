"use client";

import { useState } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

function Button({
  variant = "primary",
  loading = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      type="button"
      data-variant={variant}
      aria-busy={loading || undefined}
      className="ab-btn"
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="ab-spinner" aria-hidden />}
      {children}
    </button>
  );
}

export default function ActionButton() {
  const [loading, setLoading] = useState(false);

  const runLoading = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1600);
  };

  return (
    <section className="flex min-h-[20rem] w-full flex-wrap items-center justify-center gap-3 bg-slate-950 p-8">
      <Button variant="primary" onClick={runLoading} loading={loading}>
        {loading ? "Saving" : "Primary"}
      </Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>

      <style>{`
        .ab-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--ai-space-2, 0.5rem);
          border-radius: var(--ai-radius, 0.5rem);
          padding: var(--ai-space-2, 0.5rem) var(--ai-space-4, 1rem);
          font-size: var(--ai-text-sm, 0.875rem);
          font-weight: 600;
          line-height: 1.25rem;
          border: 1px solid transparent;
          cursor: pointer;
          transition:
            background-color var(--ai-duration, 200ms) var(--ai-ease, ease),
            border-color var(--ai-duration, 200ms) var(--ai-ease, ease),
            transform var(--ai-duration-fast, 150ms) var(--ai-ease, ease);
        }
        .ab-btn:active {
          transform: translateY(1px);
        }
        .ab-btn:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: 2px;
        }
        .ab-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .ab-btn[data-variant="primary"] {
          background: var(--ai-primary, #0ea5e9);
          color: var(--ai-primary-fg, #ffffff);
        }
        .ab-btn[data-variant="primary"]:hover:not(:disabled) {
          background: var(--ai-primary-hover, #0284c7);
        }
        .ab-btn[data-variant="secondary"] {
          background: var(--ai-surface-2, #1e293b);
          color: var(--ai-text, #e2e8f0);
          border-color: var(--ai-border, #334155);
        }
        .ab-btn[data-variant="secondary"]:hover:not(:disabled) {
          border-color: var(--ai-primary, #38bdf8);
        }
        .ab-btn[data-variant="ghost"] {
          background: transparent;
          color: var(--ai-text, #e2e8f0);
        }
        .ab-btn[data-variant="ghost"]:hover:not(:disabled) {
          background: var(--ai-surface-2, #1e293b);
        }
        .ab-btn[data-variant="destructive"] {
          background: var(--ai-danger, #ef4444);
          color: var(--ai-danger-fg, #ffffff);
        }
        .ab-btn[data-variant="destructive"]:hover:not(:disabled) {
          filter: brightness(1.08);
        }
        .ab-spinner {
          width: 0.9em;
          height: 0.9em;
          border-radius: 9999px;
          border: 2px solid currentColor;
          border-right-color: transparent;
          animation: ab-spin 0.6s linear infinite;
        }
        @keyframes ab-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ab-btn {
            transition: none;
          }
          .ab-btn:active {
            transform: none;
          }
          .ab-spinner {
            animation-duration: 1.4s;
          }
        }
      `}</style>
    </section>
  );
}
