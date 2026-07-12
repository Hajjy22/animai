"use client";

import { useId, useRef, useState } from "react";

const TABS = [
  { id: "overview", label: "Overview", content: "A quick summary of what's happening across your workspace." },
  { id: "activity", label: "Activity", content: "Recent events, comments, and changes from your team." },
  { id: "settings", label: "Settings", content: "Manage preferences, integrations, and notifications." },
];

export default function Tabs() {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (index: number) => {
    const next = (index + TABS.length) % TABS.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusTab(active + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusTab(active - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(TABS.length - 1);
    }
  };

  return (
    <section className="flex min-h-[20rem] w-full items-center justify-center bg-slate-950 p-8">
      <div className="tabs-root">
        <div role="tablist" aria-label="Workspace sections" className="tabs-list" onKeyDown={onKeyDown}>
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={active === index}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={active === index ? 0 : -1}
              className="tabs-tab"
              data-active={active === index}
              onClick={() => setActive(index)}
            >
              {tab.label}
            </button>
          ))}
          <span className="tabs-indicator" style={{ ["--tabs-active" as string]: active }} aria-hidden />
        </div>

        {TABS.map((tab, index) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${baseId}-panel-${tab.id}`}
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            hidden={active !== index}
            className="tabs-panel"
          >
            {tab.content}
          </div>
        ))}

        <style>{`
          .tabs-root {
            width: 100%;
            max-width: 24rem;
          }
          .tabs-list {
            position: relative;
            display: flex;
            gap: var(--ai-space-1, 0.25rem);
            border-bottom: 1px solid var(--ai-border, #1e293b);
          }
          .tabs-tab {
            position: relative;
            z-index: 1;
            border: none;
            background: transparent;
            color: var(--ai-text-muted, #94a3b8);
            padding: 0.55rem 0.9rem;
            font-size: var(--ai-text-sm, 0.875rem);
            font-weight: 600;
            cursor: pointer;
            transition: color var(--ai-duration, 200ms) var(--ai-ease, ease);
          }
          .tabs-tab[data-active="true"] {
            color: var(--ai-text, #e2e8f0);
          }
          .tabs-tab:focus-visible {
            outline: 2px solid var(--ai-ring, #38bdf8);
            outline-offset: -2px;
            border-radius: var(--ai-radius-sm, 0.375rem);
          }
          .tabs-indicator {
            position: absolute;
            bottom: -1px;
            left: 0;
            height: 2px;
            width: calc(100% / 3);
            background: var(--ai-primary, #38bdf8);
            transform: translateX(calc(var(--tabs-active, 0) * 100%));
            transition: transform var(--ai-duration, 200ms) var(--ai-ease-out, cubic-bezier(0.16, 1, 0.3, 1));
          }
          .tabs-panel {
            padding: var(--ai-space-4, 1rem) 0.1rem;
            font-size: var(--ai-text-sm, 0.875rem);
            color: var(--ai-text-muted, #cbd5e1);
            line-height: 1.5;
          }
          @media (prefers-reduced-motion: reduce) {
            .tabs-tab,
            .tabs-indicator {
              transition: none;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
