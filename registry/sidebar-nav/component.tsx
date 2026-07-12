"use client";

import { useState } from "react";

const ICONS: Record<string, string> = {
  home: "M4 10.5L10 5l6 5.5V16a1 1 0 01-1 1h-3v-4H8v4H5a1 1 0 01-1-1z",
  projects: "M4 6h4l2 2h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z",
  team: "M7 8a2 2 0 100-4 2 2 0 000 4zM13 8a2 2 0 100-4 2 2 0 000 4zM3 16c0-2.2 1.8-4 4-4s4 1.8 4 4M9 16c0-1.8 1.5-3.5 4-3.5s4 1.7 4 3.5",
  settings: "M10 6.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM10 2v2M10 16v2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M2 10h2M16 10h2M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4",
};

const NAV = [
  { id: "home", label: "Home" },
  { id: "projects", label: "Projects" },
  { id: "team", label: "Team" },
  { id: "settings", label: "Settings" },
];

export default function SidebarNav() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("projects");

  return (
    <section className="flex min-h-[24rem] w-full bg-slate-950 p-4">
      <nav aria-label="Primary" className="sn-nav" data-collapsed={collapsed}>
        <button
          type="button"
          className="sn-toggle"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((v) => !v)}
        >
          <svg viewBox="0 0 20 20" fill="none" data-collapsed={collapsed} aria-hidden>
            <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <ul className="sn-list">
          {NAV.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="sn-item"
                data-active={active === item.id}
                aria-current={active === item.id ? "page" : undefined}
                onClick={() => setActive(item.id)}
              >
                <svg className="sn-icon" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d={ICONS[item.id]} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {!collapsed && <span className="sn-label">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <style>{`
        .sn-nav {
          display: flex;
          flex-direction: column;
          gap: var(--ai-space-4, 1rem);
          width: 14rem;
          border-radius: var(--ai-radius-lg, 0.75rem);
          border: 1px solid var(--ai-border, #1e293b);
          background: var(--ai-surface, #0f172a);
          padding: var(--ai-space-3, 0.75rem);
          transition: width var(--ai-duration-slow, 320ms) var(--ai-ease, ease);
        }
        .sn-nav[data-collapsed="true"] {
          width: 3.75rem;
        }
        .sn-toggle {
          display: flex;
          align-self: flex-end;
          padding: 0.3rem;
          border: none;
          background: transparent;
          color: var(--ai-text-muted, #94a3b8);
          cursor: pointer;
          border-radius: var(--ai-radius-sm, 0.375rem);
        }
        .sn-toggle svg {
          width: 1rem;
          height: 1rem;
          transition: transform var(--ai-duration, 200ms) var(--ai-ease, ease);
        }
        .sn-toggle svg[data-collapsed="true"] {
          transform: rotate(180deg);
        }
        .sn-toggle:hover {
          color: var(--ai-text, #e2e8f0);
        }
        .sn-toggle:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: 2px;
        }
        .sn-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: var(--ai-space-1, 0.25rem);
        }
        .sn-item {
          display: flex;
          align-items: center;
          gap: var(--ai-space-3, 0.75rem);
          width: 100%;
          border: none;
          background: transparent;
          color: var(--ai-text-muted, #94a3b8);
          padding: 0.55rem 0.6rem;
          border-radius: var(--ai-radius, 0.5rem);
          font-size: var(--ai-text-sm, 0.875rem);
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
        }
        .sn-item[data-active="true"] {
          background: var(--ai-surface-2, #1e293b);
          color: var(--ai-text, #e2e8f0);
        }
        .sn-item:hover {
          color: var(--ai-text, #e2e8f0);
        }
        .sn-item:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: -2px;
        }
        .sn-icon {
          width: 1.15rem;
          height: 1.15rem;
          flex-shrink: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .sn-nav, .sn-toggle svg {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
