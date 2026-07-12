"use client";

import { useEffect, useRef } from "react";

const MESSAGES = ["NOW BOARDING", "GATE 22 ON TIME", "ENJOY THE RIDE"];
const CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const COLS = 15;
const TICK_MS = 65;
const HOLD_MS = 2600;
const COLUMN_STAGGER_MS = 90;

function padMessage(message: string): string {
  const trimmed = message.slice(0, COLS);
  const left = Math.floor((COLS - trimmed.length) / 2);
  return (" ".repeat(left) + trimmed).padEnd(COLS, " ");
}

// An airport split-flap departure board: every cell flips through the charset
// with a 3D flap animation until it lands on its target character, columns
// starting left-to-right. Direct DOM updates via refs — 15 cells ticking at
// ~15Hz would cause needless React re-render churn as state.
export default function SplitFlapBoard() {
  const cellRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let disposed = false;
    let messageIndex = 0;
    // Per-cell animation state: current charset index, target index, start time.
    const cells = Array.from({ length: COLS }, () => ({ current: 0, target: 0, startAt: 0, lastTick: 0 }));

    const setMessage = (message: string, now: number) => {
      const padded = padMessage(message);
      cells.forEach((cell, index) => {
        cell.target = Math.max(0, CHARSET.indexOf(padded[index]));
        cell.startAt = now + index * COLUMN_STAGGER_MS;
        cell.lastTick = 0;
      });
    };

    const applyChar = (index: number, char: string, flip: boolean) => {
      const el = cellRefs.current[index];
      if (!el) return;
      el.textContent = char;
      if (flip) {
        // Retrigger the flap animation.
        el.classList.remove("sfb-flip");
        void el.offsetWidth;
        el.classList.add("sfb-flip");
      }
    };

    if (reducedMotion) {
      // No flipping — just rotate the messages statically.
      const padded = padMessage(MESSAGES[0]);
      padded.split("").forEach((char, index) => applyChar(index, char, false));
      const interval = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % MESSAGES.length;
        const next = padMessage(MESSAGES[messageIndex]);
        next.split("").forEach((char, index) => applyChar(index, char, false));
      }, HOLD_MS + 1000);
      return () => window.clearInterval(interval);
    }

    let holdUntil = 0;
    setMessage(MESSAGES[0], performance.now());

    const tick = (now: number) => {
      if (disposed) return;
      let allLanded = true;

      cells.forEach((cell, index) => {
        if (now < cell.startAt) {
          allLanded = false;
          return;
        }
        if (cell.current === cell.target) return;
        allLanded = false;
        if (now - cell.lastTick >= TICK_MS) {
          cell.lastTick = now;
          cell.current = (cell.current + 1) % CHARSET.length;
          applyChar(index, CHARSET[cell.current], true);
        }
      });

      if (allLanded) {
        if (holdUntil === 0) {
          holdUntil = now + HOLD_MS;
        } else if (now >= holdUntil) {
          holdUntil = 0;
          messageIndex = (messageIndex + 1) % MESSAGES.length;
          setMessage(MESSAGES[messageIndex], now);
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="sfb-board" role="img" aria-label={MESSAGES.join(". ")}>
        {Array.from({ length: COLS }, (_, index) => (
          <span
            key={index}
            ref={(el) => {
              cellRefs.current[index] = el;
            }}
            aria-hidden
            className="sfb-cell"
          >
            {" "}
          </span>
        ))}
      </div>
      <style>{`
        .sfb-board {
          display: flex;
          gap: 0.3rem;
          padding: 1rem 1.2rem;
          border-radius: 0.75rem;
          background: #0b1220;
          border: 1px solid #1e293b;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);
          perspective: 600px;
        }
        .sfb-cell {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: clamp(1.3rem, 4.2vw, 2.6rem);
          height: clamp(1.9rem, 6vw, 3.8rem);
          border-radius: 0.3rem;
          background: linear-gradient(#1a2438 49.5%, #131c2e 50.5%);
          color: #f1f5f9;
          font-family: ui-monospace, "Cascadia Code", Menlo, monospace;
          font-size: clamp(1rem, 3.4vw, 2.1rem);
          font-weight: 700;
          transform-style: preserve-3d;
        }
        .sfb-cell::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: rgba(2, 6, 23, 0.85);
        }
        .sfb-flip {
          animation: sfb-flap ${TICK_MS}ms ease-in;
        }
        @keyframes sfb-flap {
          0% { transform: rotateX(0deg); }
          50% { transform: rotateX(-52deg); filter: brightness(0.75); }
          100% { transform: rotateX(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sfb-flip {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
