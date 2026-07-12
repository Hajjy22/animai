const TRAIL = [
  { label: "Projects", href: "#" },
  { label: "Marketing Site", href: "#" },
  { label: "Landing Page", href: "#", current: true },
];

export default function Breadcrumbs() {
  return (
    <section className="flex min-h-[20rem] w-full items-center justify-center bg-slate-950 p-8">
      <nav aria-label="Breadcrumb" className="bc-nav">
        <ol className="bc-list">
          {TRAIL.map((item, index) => (
            <li key={item.label} className="bc-item">
              {index > 0 && (
                <svg className="bc-sep" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M7 5l6 5-6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {item.current ? (
                <span aria-current="page" className="bc-current">
                  {item.label}
                </span>
              ) : (
                <a href={item.href} className="bc-link">
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <style>{`
        .bc-nav {
          width: 100%;
          max-width: 26rem;
          overflow-x: auto;
        }
        .bc-list {
          display: flex;
          align-items: center;
          list-style: none;
          margin: 0;
          padding: 0;
          white-space: nowrap;
        }
        .bc-item {
          display: flex;
          align-items: center;
          gap: var(--ai-space-2, 0.5rem);
        }
        .bc-sep {
          width: 1rem;
          height: 1rem;
          color: var(--ai-text-muted, #64748b);
          margin: 0 var(--ai-space-1, 0.25rem);
          flex-shrink: 0;
        }
        .bc-link {
          font-size: var(--ai-text-sm, 0.875rem);
          color: var(--ai-text-muted, #94a3b8);
          text-decoration: none;
          border-radius: var(--ai-radius-sm, 0.375rem);
        }
        .bc-link:hover {
          color: var(--ai-text, #e2e8f0);
          text-decoration: underline;
        }
        .bc-link:focus-visible {
          outline: 2px solid var(--ai-ring, #38bdf8);
          outline-offset: 2px;
        }
        .bc-current {
          font-size: var(--ai-text-sm, 0.875rem);
          font-weight: 600;
          color: var(--ai-text, #e2e8f0);
        }
      `}</style>
    </section>
  );
}
