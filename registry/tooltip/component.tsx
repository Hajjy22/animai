// A pure CSS + ARIA tooltip — shows on hover and keyboard focus, no client JS.
// The trigger references its tooltip via aria-describedby so screen readers
// announce it; the bubble is role="tooltip".
function Tip({ id, label, tip }: { id: string; label: string; tip: string }) {
  return (
    <span className="tt-wrap">
      <button type="button" className="tt-trigger" aria-describedby={id}>
        {label}
      </button>
      <span id={id} role="tooltip" className="tt-bubble">
        {tip}
        <span className="tt-arrow" aria-hidden />
      </span>
    </span>
  );
}

export default function Tooltip() {
  return (
    <section className="flex min-h-[20rem] w-full items-center justify-center gap-6 bg-slate-950 p-8">
      <Tip id="tt-save" label="Save" tip="Save your changes (⌘S)" />
      <Tip id="tt-share" label="Share" tip="Anyone with the link can view" />
      <Tip id="tt-delete" label="Delete" tip="This can't be undone" />

      <style>{`
        .tt-wrap {
          position: relative;
          display: inline-flex;
        }
        .tt-trigger {
          border-radius: var(--ai-radius, 0.5rem);
          background: var(--ai-surface-2, #1e293b);
          color: var(--ai-text, #e2e8f0);
          border: 1px solid var(--ai-border, #334155);
          padding: 0.45rem 0.85rem;
          font-size: var(--ai-text-sm, 0.875rem);
          font-weight: 600;
          cursor: pointer;
        }
        .tt-trigger:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: 2px;
        }
        .tt-bubble {
          position: absolute;
          bottom: calc(100% + 0.55rem);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          z-index: 20;
          white-space: nowrap;
          border-radius: var(--ai-radius-sm, 0.375rem);
          background: var(--ai-text, #0f172a);
          color: var(--ai-bg, #ffffff);
          padding: 0.3rem 0.55rem;
          font-size: var(--ai-text-xs, 0.75rem);
          font-weight: 500;
          box-shadow: var(--ai-shadow, 0 4px 12px rgba(0, 0, 0, 0.5));
          opacity: 0;
          pointer-events: none;
          transition:
            opacity var(--ai-duration, 200ms) var(--ai-ease, ease),
            transform var(--ai-duration, 200ms) var(--ai-ease, ease);
          transition-delay: 0ms;
        }
        .tt-trigger:hover + .tt-bubble,
        .tt-trigger:focus-visible + .tt-bubble {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          transition-delay: 250ms;
        }
        .tt-arrow {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-50%) rotate(45deg);
          width: 0.5rem;
          height: 0.5rem;
          background: var(--ai-text, #0f172a);
        }
        @media (prefers-reduced-motion: reduce) {
          .tt-bubble {
            transition: opacity var(--ai-duration, 200ms) var(--ai-ease, ease);
            transform: translateX(-50%);
          }
          .tt-trigger:hover + .tt-bubble,
          .tt-trigger:focus-visible + .tt-bubble {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
