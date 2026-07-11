"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const TARGET_TEXT = "DECODING YOUR NEXT FEATURE";
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*";

export default function TextScrambleReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = textRef.current;
      if (!el) return;

      const proxy = { progress: 0 };
      gsap.to(proxy, {
        progress: 1,
        duration: 2.2,
        ease: "power1.inOut",
        repeat: -1,
        repeatDelay: 1.4,
        onUpdate: () => {
          const revealCount = Math.floor(proxy.progress * TARGET_TEXT.length);
          let output = "";
          for (let i = 0; i < TARGET_TEXT.length; i += 1) {
            const char = TARGET_TEXT[i];
            if (char === " ") {
              output += " ";
            } else if (i < revealCount) {
              output += char;
            } else {
              output += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }
          }
          el.textContent = output;
        },
      });
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="flex w-full items-center justify-center overflow-hidden bg-slate-950 px-6 py-24 text-white"
    >
      <h2 ref={textRef} className="font-mono text-2xl font-semibold tracking-wider sm:text-4xl">
        {TARGET_TEXT}
      </h2>
    </section>
  );
}
