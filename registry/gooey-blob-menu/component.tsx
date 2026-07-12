"use client";

import { useState } from "react";

const ITEMS = [
  { id: "compose", glyph: "✎", label: "Compose" },
  { id: "photo", glyph: "✦", label: "Photo" },
  { id: "link", glyph: "∞", label: "Link" },
  { id: "mic", glyph: "●", label: "Voice" },
];

// A metaball action menu: the launcher and its items share an SVG "goo"
// filter (blur + alpha contrast), so the blobs visibly merge and split as
// they spring out. The filter wraps only the blob layer — the glyphs ride on
// top unfiltered so they stay crisp.
export default function GooeyBlobMenu() {
  const [open, setOpen] = useState(false);

  return (
    <section className="flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950">
      {/* The goo filter itself — blur then crank alpha contrast. */}
      <svg width="0" height="0" aria-hidden>
        <defs>
          <filter id="animai-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="gbm-root" data-open={open}>
        <div className="gbm-goo-layer" aria-hidden>
          <span className="gbm-blob gbm-blob--core" />
          {ITEMS.map((item, index) => (
            <span
              key={item.id}
              className="gbm-blob gbm-blob--item"
              style={{ ["--gbm-index" as string]: index }}
            />
          ))}
        </div>

        <button
          type="button"
          className="gbm-trigger"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="gbm-plus" data-open={open}>
            +
          </span>
        </button>
        {ITEMS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="gbm-item"
            style={{ ["--gbm-index" as string]: index }}
            data-open={open}
            tabIndex={open ? 0 : -1}
            aria-label={item.label}
            onClick={() => setOpen(false)}
          >
            {item.glyph}
          </button>
        ))}
      </div>

      <style>{`
        .gbm-root {
          position: relative;
          width: 4.5rem;
          height: 4.5rem;
        }
        .gbm-goo-layer {
          position: absolute;
          inset: -8rem;
          filter: url(#animai-goo);
          pointer-events: none;
        }
        .gbm-blob {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 4.5rem;
          height: 4.5rem;
          margin: -2.25rem 0 0 -2.25rem;
          border-radius: 9999px;
          background: #38bdf8;
        }
        .gbm-blob--item {
          width: 3.2rem;
          height: 3.2rem;
          margin: -1.6rem 0 0 -1.6rem;
          transform: translate(0, 0) scale(0.4);
          transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
          transition-delay: calc(var(--gbm-index) * 45ms);
        }
        .gbm-root[data-open="true"] .gbm-blob--item {
          transform:
            translate(
              calc(cos((var(--gbm-index) * 32deg) + 42deg) * -7rem),
              calc(sin((var(--gbm-index) * 32deg) + 42deg) * -7rem)
            )
            scale(1);
        }
        .gbm-trigger {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: none;
          background: transparent;
          color: #020617;
          cursor: pointer;
          z-index: 2;
        }
        .gbm-trigger:focus-visible {
          outline: 2px solid #e2e8f0;
          outline-offset: 4px;
        }
        .gbm-plus {
          display: inline-block;
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
          transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .gbm-plus[data-open="true"] {
          transform: rotate(135deg);
        }
        .gbm-item {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 3.2rem;
          height: 3.2rem;
          margin: -1.6rem 0 0 -1.6rem;
          border-radius: 9999px;
          border: none;
          background: transparent;
          color: #020617;
          font-size: 1.15rem;
          cursor: pointer;
          z-index: 2;
          opacity: 0;
          pointer-events: none;
          transform: translate(0, 0);
          transition:
            transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 200ms ease;
          transition-delay: calc(var(--gbm-index) * 45ms);
        }
        .gbm-item[data-open="true"] {
          opacity: 1;
          pointer-events: auto;
          transform: translate(
            calc(cos((var(--gbm-index) * 32deg) + 42deg) * -7rem),
            calc(sin((var(--gbm-index) * 32deg) + 42deg) * -7rem)
          );
        }
        .gbm-item:focus-visible {
          outline: 2px solid #e2e8f0;
          outline-offset: 4px;
        }
        @media (prefers-reduced-motion: reduce) {
          .gbm-blob--item,
          .gbm-item,
          .gbm-plus {
            transition: opacity 200ms ease;
          }
        }
      `}</style>
    </section>
  );
}
