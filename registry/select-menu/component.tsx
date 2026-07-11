"use client";

import { useEffect, useId, useRef, useState } from "react";

const OPTIONS = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "jp", label: "Japan" },
  { value: "au", label: "Australia" },
];

export default function SelectMenu() {
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(OPTIONS[0].value);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = OPTIONS.find((o) => o.value === selected) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [open]);

  const commit = (index: number) => {
    setSelected(OPTIONS[index].value);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setOpen(true);
      setActive(OPTIONS.findIndex((o) => o.value === selected));
      return;
    }
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, OPTIONS.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(OPTIONS.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(active);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <section className="flex min-h-[20rem] w-full items-start justify-center bg-slate-950 p-8 pt-16">
      <div ref={rootRef} className="sm-root">
        <span id={labelId} className="sm-label">
          Country
        </span>
        <button
          type="button"
          className="sm-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onKeyDown}
        >
          <span>{selectedOption.label}</span>
          <svg className="sm-chevron" data-open={open} viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <ul ref={listRef} className="sm-list" role="listbox" aria-labelledby={labelId} tabIndex={-1}>
            {OPTIONS.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === selected}
                data-active={index === active}
                className="sm-option"
                onMouseEnter={() => setActive(index)}
                onClick={() => commit(index)}
              >
                <span>{option.label}</span>
                {option.value === selected && (
                  <svg className="sm-check" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}

        <style>{`
          .sm-root {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: var(--ai-space-2, 0.5rem);
            width: 100%;
            max-width: 16rem;
          }
          .sm-label {
            font-size: var(--ai-text-sm, 0.875rem);
            font-weight: 600;
            color: var(--ai-text, #e2e8f0);
          }
          .sm-trigger {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--ai-space-2, 0.5rem);
            width: 100%;
            border-radius: var(--ai-radius, 0.5rem);
            border: 1px solid var(--ai-border, #334155);
            background: var(--ai-surface, #0f172a);
            color: var(--ai-text, #e2e8f0);
            padding: 0.55rem 0.75rem;
            font-size: var(--ai-text-sm, 0.875rem);
            cursor: pointer;
            transition: border-color var(--ai-duration, 200ms) var(--ai-ease, ease);
          }
          .sm-trigger:hover {
            border-color: var(--ai-primary, #38bdf8);
          }
          .sm-trigger:focus-visible {
            outline: 2px solid var(--ai-ring, #38bdf8);
            outline-offset: 2px;
          }
          .sm-chevron {
            width: 1.1rem;
            height: 1.1rem;
            color: var(--ai-text-muted, #94a3b8);
            transition: transform var(--ai-duration, 200ms) var(--ai-ease, ease);
          }
          .sm-chevron[data-open="true"] {
            transform: rotate(180deg);
          }
          .sm-list {
            position: absolute;
            top: calc(100% + 0.35rem);
            left: 0;
            right: 0;
            z-index: 20;
            margin: 0;
            padding: 0.3rem;
            list-style: none;
            border-radius: var(--ai-radius, 0.5rem);
            border: 1px solid var(--ai-border, #334155);
            background: var(--ai-surface, #0f172a);
            box-shadow: var(--ai-shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.6));
            animation: sm-pop var(--ai-duration-fast, 150ms) var(--ai-ease-out, ease);
          }
          .sm-option {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--ai-space-2, 0.5rem);
            padding: 0.5rem 0.6rem;
            border-radius: var(--ai-radius-sm, 0.375rem);
            font-size: var(--ai-text-sm, 0.875rem);
            color: var(--ai-text, #e2e8f0);
            cursor: pointer;
          }
          .sm-option[data-active="true"] {
            background: var(--ai-surface-2, #1e293b);
          }
          .sm-check {
            width: 0.9rem;
            height: 0.9rem;
            color: var(--ai-primary, #38bdf8);
          }
          @keyframes sm-pop {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .sm-chevron,
            .sm-trigger {
              transition: none;
            }
            .sm-list {
              animation: none;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
