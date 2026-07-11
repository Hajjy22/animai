"use client";

import { useId, useState } from "react";

export default function RangeSlider() {
  const id = useId();
  const [value, setValue] = useState(64);
  const percent = value; // 0–100 range keeps bubble math simple

  return (
    <section className="flex min-h-[20rem] w-full items-center justify-center bg-slate-950 p-8">
      <div className="rs-root" style={{ ["--rs-percent" as string]: `${percent}%` }}>
        <div className="rs-head">
          <label htmlFor={id} className="rs-label">
            Budget
          </label>
          <span className="rs-value">${value}</span>
        </div>

        <div className="rs-track-wrap">
          <div className="rs-track" aria-hidden>
            <div className="rs-fill" />
          </div>
          <output className="rs-bubble" aria-hidden>
            ${value}
          </output>
          <input
            id={id}
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            aria-label="Budget"
            className="rs-input"
          />
        </div>

        <style>{`
          .rs-root {
            display: flex;
            flex-direction: column;
            gap: var(--ai-space-4, 1rem);
            width: 100%;
            max-width: 20rem;
          }
          .rs-head {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
          }
          .rs-label {
            font-size: var(--ai-text-sm, 0.875rem);
            font-weight: 600;
            color: var(--ai-text, #e2e8f0);
          }
          .rs-value {
            font-size: var(--ai-text-sm, 0.875rem);
            font-variant-numeric: tabular-nums;
            color: var(--ai-primary, #38bdf8);
          }
          .rs-track-wrap {
            position: relative;
            height: 1.5rem;
            display: flex;
            align-items: center;
          }
          .rs-track {
            position: absolute;
            left: 0;
            right: 0;
            height: 0.4rem;
            border-radius: 9999px;
            background: var(--ai-surface-2, #1e293b);
            overflow: hidden;
          }
          .rs-fill {
            height: 100%;
            width: var(--rs-percent, 50%);
            background: var(--ai-primary, #0ea5e9);
            transition: width var(--ai-duration-fast, 150ms) var(--ai-ease, ease);
          }
          .rs-bubble {
            position: absolute;
            top: -1.9rem;
            left: var(--rs-percent, 50%);
            transform: translateX(-50%);
            padding: 0.1rem 0.4rem;
            border-radius: var(--ai-radius-sm, 0.375rem);
            background: var(--ai-primary, #0ea5e9);
            color: var(--ai-primary-fg, #ffffff);
            font-size: var(--ai-text-xs, 0.75rem);
            font-variant-numeric: tabular-nums;
            transition: left var(--ai-duration-fast, 150ms) var(--ai-ease, ease);
          }
          .rs-input {
            position: relative;
            width: 100%;
            margin: 0;
            background: transparent;
            -webkit-appearance: none;
            appearance: none;
            cursor: pointer;
          }
          .rs-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 1.15rem;
            height: 1.15rem;
            border-radius: 9999px;
            background: #ffffff;
            border: 2px solid var(--ai-primary, #0ea5e9);
            box-shadow: var(--ai-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.4));
          }
          .rs-input::-moz-range-thumb {
            width: 1.15rem;
            height: 1.15rem;
            border-radius: 9999px;
            background: #ffffff;
            border: 2px solid var(--ai-primary, #0ea5e9);
          }
          .rs-input:focus-visible {
            outline: none;
          }
          .rs-input:focus-visible::-webkit-slider-thumb {
            outline: 2px solid var(--ai-ring, #38bdf8);
            outline-offset: 2px;
          }
          .rs-input:focus-visible::-moz-range-thumb {
            outline: 2px solid var(--ai-ring, #38bdf8);
            outline-offset: 2px;
          }
          @media (prefers-reduced-motion: reduce) {
            .rs-fill,
            .rs-bubble {
              transition: none;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
