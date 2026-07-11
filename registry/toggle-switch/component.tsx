"use client";

import { useId, useState } from "react";

function Switch({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  const id = useId();

  return (
    <div className="ts-row">
      <label htmlFor={id} className="ts-label">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((v) => !v)}
        className="ts-switch"
        data-on={on}
      >
        <span className="ts-knob" aria-hidden />
      </button>
    </div>
  );
}

export default function ToggleSwitch() {
  return (
    <section className="flex min-h-[20rem] w-full items-center justify-center bg-slate-950 p-8">
      <div className="ts-stack">
        <Switch label="Email notifications" defaultOn />
        <Switch label="Two-factor auth" />
        <Switch label="Public profile" defaultOn />

        <style>{`
          .ts-stack {
            display: flex;
            flex-direction: column;
            gap: var(--ai-space-4, 1rem);
            width: 100%;
            max-width: 18rem;
          }
          .ts-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--ai-space-4, 1rem);
          }
          .ts-label {
            font-size: var(--ai-text-sm, 0.875rem);
            color: var(--ai-text, #e2e8f0);
            cursor: pointer;
          }
          .ts-switch {
            position: relative;
            flex-shrink: 0;
            width: 2.75rem;
            height: 1.5rem;
            border-radius: 9999px;
            border: none;
            cursor: pointer;
            background: var(--ai-surface-2, #334155);
            transition: background-color var(--ai-duration, 200ms) var(--ai-ease, ease);
          }
          .ts-switch[data-on="true"] {
            background: var(--ai-primary, #0ea5e9);
          }
          .ts-switch:focus-visible {
            outline: 2px solid var(--ai-ring, #38bdf8);
            outline-offset: 2px;
          }
          .ts-knob {
            position: absolute;
            top: 0.185rem;
            left: 0.185rem;
            width: 1.13rem;
            height: 1.13rem;
            border-radius: 9999px;
            background: #ffffff;
            box-shadow: var(--ai-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.3));
            transition: transform var(--ai-duration, 200ms) var(--ai-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
          }
          .ts-switch[data-on="true"] .ts-knob {
            transform: translateX(1.25rem);
          }
          @media (prefers-reduced-motion: reduce) {
            .ts-switch,
            .ts-knob {
              transition: none;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
