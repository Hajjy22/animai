"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const COMMANDS = [
  { id: "new-file", label: "New file" },
  { id: "new-project", label: "New project" },
  { id: "search", label: "Search everywhere" },
  { id: "settings", label: "Open settings" },
  { id: "invite", label: "Invite teammate" },
  { id: "docs", label: "View documentation" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const results = useMemo(
    () => COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      } else if (event.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery("");
      setActive(0);
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <section className="relative flex min-h-[24rem] w-full items-center justify-center overflow-hidden bg-slate-950 p-8">
      <button ref={triggerRef} type="button" className="cp-trigger" onClick={() => setOpen(true)}>
        <span>Search commands…</span>
        <kbd className="cp-kbd">⌘K</kbd>
      </button>

      {open && (
        <div className="cp-overlay" role="presentation" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            className="cp-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <span id={labelId} className="cp-visually-hidden">
              Command palette
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Type a command…"
              aria-label="Search commands"
              role="combobox"
              aria-expanded
              aria-controls={`${labelId}-list`}
              className="cp-input"
            />
            <ul id={`${labelId}-list`} role="listbox" className="cp-list">
              {results.length === 0 && <li className="cp-empty">No matching commands.</li>}
              {results.map((command, index) => (
                <li
                  key={command.id}
                  role="option"
                  aria-selected={active === index}
                  data-active={active === index}
                  className="cp-item"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => setOpen(false)}
                >
                  {command.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <style>{`
        .cp-trigger {
          display: inline-flex;
          align-items: center;
          gap: var(--ai-space-4, 1rem);
          border-radius: var(--ai-radius, 0.5rem);
          background: var(--ai-surface, #0f172a);
          color: var(--ai-text-muted, #94a3b8);
          border: 1px solid var(--ai-border, #334155);
          padding: 0.55rem 0.9rem;
          font-size: var(--ai-text-sm, 0.875rem);
          cursor: pointer;
        }
        .cp-trigger:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: 2px;
        }
        .cp-kbd {
          border-radius: var(--ai-radius-sm, 0.375rem);
          border: 1px solid var(--ai-border, #334155);
          padding: 0.1rem 0.4rem;
          font-family: var(--ai-font-mono, monospace);
          font-size: var(--ai-text-xs, 0.75rem);
        }
        .cp-overlay {
          position: absolute;
          inset: 0;
          z-index: 30;
          display: flex;
          justify-content: center;
          padding-top: 3rem;
          background: rgba(2, 6, 23, 0.6);
          backdrop-filter: blur(2px);
          animation: cp-fade var(--ai-duration, 200ms) var(--ai-ease, ease);
        }
        .cp-panel {
          width: 100%;
          max-width: 26rem;
          height: fit-content;
          border-radius: var(--ai-radius-lg, 0.75rem);
          border: 1px solid var(--ai-border, #1e293b);
          background: var(--ai-surface, #0f172a);
          box-shadow: var(--ai-shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.6));
          padding: var(--ai-space-3, 0.75rem);
          animation: cp-pop var(--ai-duration, 200ms) var(--ai-ease-out, cubic-bezier(0.16, 1, 0.3, 1));
        }
        .cp-visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }
        .cp-input {
          width: 100%;
          border: none;
          border-bottom: 1px solid var(--ai-border, #1e293b);
          background: transparent;
          color: var(--ai-text, #e2e8f0);
          padding: 0.5rem 0.3rem 0.75rem;
          font-size: var(--ai-text-base, 1rem);
        }
        .cp-input:focus {
          outline: none;
        }
        .cp-list {
          margin: 0.4rem 0 0;
          padding: 0;
          list-style: none;
          max-height: 14rem;
          overflow-y: auto;
        }
        .cp-item {
          padding: 0.5rem 0.6rem;
          border-radius: var(--ai-radius-sm, 0.375rem);
          font-size: var(--ai-text-sm, 0.875rem);
          color: var(--ai-text, #e2e8f0);
          cursor: pointer;
        }
        .cp-item[data-active="true"] {
          background: var(--ai-surface-2, #1e293b);
        }
        .cp-empty {
          padding: 0.5rem 0.6rem;
          font-size: var(--ai-text-sm, 0.875rem);
          color: var(--ai-text-muted, #94a3b8);
        }
        @keyframes cp-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cp-pop {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-overlay, .cp-panel { animation: none; }
        }
      `}</style>
    </section>
  );
}
