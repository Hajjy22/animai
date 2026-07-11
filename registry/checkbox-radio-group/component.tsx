"use client";

import { useId, useState } from "react";

const PLANS = [
  { value: "starter", label: "Starter", hint: "For side projects" },
  { value: "pro", label: "Pro", hint: "For growing teams" },
  { value: "scale", label: "Scale", hint: "For heavy workloads" },
];

const ADDONS = [
  { value: "analytics", label: "Analytics" },
  { value: "support", label: "Priority support" },
];

export default function CheckboxRadioGroup() {
  const groupName = useId();
  const [plan, setPlan] = useState("pro");
  const [addons, setAddons] = useState<string[]>(["analytics"]);

  const toggleAddon = (value: string) =>
    setAddons((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );

  return (
    <section className="flex min-h-[20rem] w-full items-center justify-center bg-slate-950 p-8">
      <div className="cr-cols">
        <fieldset className="cr-set">
          <legend className="cr-legend">Plan</legend>
          {PLANS.map((option) => {
            const id = `${groupName}-${option.value}`;
            return (
              <label key={option.value} htmlFor={id} className="cr-row">
                <input
                  id={id}
                  type="radio"
                  name={groupName}
                  value={option.value}
                  checked={plan === option.value}
                  onChange={() => setPlan(option.value)}
                  className="cr-input cr-radio"
                />
                <span className="cr-mark cr-mark--radio" aria-hidden />
                <span className="cr-text">
                  <span className="cr-title">{option.label}</span>
                  <span className="cr-hint">{option.hint}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <fieldset className="cr-set">
          <legend className="cr-legend">Add-ons</legend>
          {ADDONS.map((option) => {
            const id = `${groupName}-${option.value}`;
            return (
              <label key={option.value} htmlFor={id} className="cr-row">
                <input
                  id={id}
                  type="checkbox"
                  checked={addons.includes(option.value)}
                  onChange={() => toggleAddon(option.value)}
                  className="cr-input cr-check"
                />
                <span className="cr-mark cr-mark--check" aria-hidden>
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="cr-title">{option.label}</span>
              </label>
            );
          })}
        </fieldset>

        <style>{`
          .cr-cols {
            display: flex;
            flex-wrap: wrap;
            gap: var(--ai-space-8, 2rem);
          }
          .cr-set {
            border: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: var(--ai-space-3, 0.75rem);
          }
          .cr-legend {
            font-size: var(--ai-text-xs, 0.75rem);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--ai-text-muted, #94a3b8);
            margin-bottom: var(--ai-space-1, 0.25rem);
          }
          .cr-row {
            display: flex;
            align-items: center;
            gap: var(--ai-space-3, 0.75rem);
            cursor: pointer;
            color: var(--ai-text, #e2e8f0);
          }
          .cr-input {
            position: absolute;
            opacity: 0;
            width: 1px;
            height: 1px;
          }
          .cr-mark {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 1.25rem;
            height: 1.25rem;
            border: 1.5px solid var(--ai-border, #475569);
            background: var(--ai-surface, #0f172a);
            color: var(--ai-primary-fg, #ffffff);
            transition:
              border-color var(--ai-duration, 200ms) var(--ai-ease, ease),
              background-color var(--ai-duration, 200ms) var(--ai-ease, ease);
          }
          .cr-mark--radio {
            border-radius: 9999px;
          }
          .cr-mark--check {
            border-radius: var(--ai-radius-sm, 0.375rem);
          }
          .cr-mark--radio::after {
            content: "";
            width: 0.55rem;
            height: 0.55rem;
            border-radius: 9999px;
            background: #ffffff;
            transform: scale(0);
            transition: transform var(--ai-duration, 200ms) var(--ai-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
          }
          .cr-mark--check svg {
            width: 0.85rem;
            height: 0.85rem;
            stroke-dasharray: 16;
            stroke-dashoffset: 16;
            transition: stroke-dashoffset var(--ai-duration, 200ms) var(--ai-ease, ease);
          }
          .cr-input:checked + .cr-mark {
            border-color: var(--ai-primary, #0ea5e9);
            background: var(--ai-primary, #0ea5e9);
          }
          .cr-input:checked + .cr-mark--radio::after {
            transform: scale(1);
          }
          .cr-input:checked + .cr-mark--check svg {
            stroke-dashoffset: 0;
          }
          .cr-input:focus-visible + .cr-mark {
            outline: 2px solid var(--ai-ring, #38bdf8);
            outline-offset: 2px;
          }
          .cr-text {
            display: flex;
            flex-direction: column;
          }
          .cr-title {
            font-size: var(--ai-text-sm, 0.875rem);
            font-weight: 500;
          }
          .cr-hint {
            font-size: var(--ai-text-xs, 0.75rem);
            color: var(--ai-text-muted, #94a3b8);
          }
          @media (prefers-reduced-motion: reduce) {
            .cr-mark,
            .cr-mark--radio::after,
            .cr-mark--check svg {
              transition: none;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
