"use client";

import { useEffect, useId, useRef, useState } from "react";

const ITEMS = [
  { id: "profile", label: "View profile" },
  { id: "settings", label: "Settings" },
  { id: "invite", label: "Invite team members" },
  { id: "logout", label: "Log out" },
];

export default function DropdownMenu() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActive(0);
      setOpen(true);
    }
  };

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => {
        const next = (i + 1) % ITEMS.length;
        itemRefs.current[next]?.focus();
        return next;
      });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => {
        const next = (i - 1 + ITEMS.length) % ITEMS.length;
        itemRefs.current[next]?.focus();
        return next;
      });
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
      itemRefs.current[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(ITEMS.length - 1);
      itemRefs.current[ITEMS.length - 1]?.focus();
    }
  };

  return (
    <section className="flex min-h-[20rem] w-full items-center justify-center bg-slate-950 p-8">
      <div ref={rootRef} className="dm-root">
        <button
          ref={triggerRef}
          type="button"
          className="dm-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onTriggerKeyDown}
        >
          Account
          <svg viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <ul id={menuId} role="menu" aria-label="Account" className="dm-menu" onKeyDown={onMenuKeyDown}>
            {ITEMS.map((item, index) => (
              <li key={item.id} role="none">
                <button
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  role="menuitem"
                  type="button"
                  tabIndex={-1}
                  className="dm-item"
                  data-active={active === index}
                  onMouseEnter={() => setActive(index)}
                  onClick={close}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        <style>{`
          .dm-root { position: relative; display: inline-block; }
          .dm-trigger {
            display: inline-flex;
            align-items: center;
            gap: var(--ai-space-2, 0.5rem);
            border-radius: var(--ai-radius, 0.5rem);
            background: var(--ai-surface-2, #1e293b);
            color: var(--ai-text, #e2e8f0);
            border: 1px solid var(--ai-border, #334155);
            padding: 0.5rem 0.9rem;
            font-size: var(--ai-text-sm, 0.875rem);
            font-weight: 600;
            cursor: pointer;
          }
          .dm-trigger svg { width: 1rem; height: 1rem; }
          .dm-trigger:focus-visible {
            outline: 2px solid var(--ai-ring, #38bdf8);
            outline-offset: 2px;
          }
          .dm-menu {
            position: absolute;
            top: calc(100% + 0.4rem);
            left: 0;
            z-index: 20;
            width: 12rem;
            margin: 0;
            padding: 0.3rem;
            list-style: none;
            border-radius: var(--ai-radius, 0.5rem);
            border: 1px solid var(--ai-border, #1e293b);
            background: var(--ai-surface, #0f172a);
            box-shadow: var(--ai-shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.6));
            animation: dm-pop var(--ai-duration-fast, 150ms) var(--ai-ease-out, ease);
          }
          .dm-item {
            width: 100%;
            text-align: left;
            border: none;
            background: transparent;
            color: var(--ai-text, #e2e8f0);
            font-size: var(--ai-text-sm, 0.875rem);
            padding: 0.45rem 0.6rem;
            border-radius: var(--ai-radius-sm, 0.375rem);
            cursor: pointer;
          }
          .dm-item[data-active="true"] {
            background: var(--ai-surface-2, #1e293b);
          }
          .dm-item:focus-visible {
            outline: 2px solid var(--ai-ring, #38bdf8);
            outline-offset: -2px;
          }
          @keyframes dm-pop {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .dm-menu { animation: none; }
          }
        `}</style>
      </div>
    </section>
  );
}
