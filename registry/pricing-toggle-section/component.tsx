"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const MONTHLY_PRICE = 59;
const YEARLY_PRICE = 41;

export default function PricingToggleSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const priceRef = useRef<HTMLSpanElement>(null);
  const [isYearly, setIsYearly] = useState(false);
  const displayedPrice = useRef(MONTHLY_PRICE);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const toggle = contextSafe(() => {
    const nextYearly = !isYearly;
    setIsYearly(nextYearly);
    const target = nextYearly ? YEARLY_PRICE : MONTHLY_PRICE;

    gsap.to(knobRef.current, {
      x: nextYearly ? 28 : 0,
      duration: 0.35,
      ease: "power2.out",
    });

    const proxy = { value: displayedPrice.current };
    gsap.to(proxy, {
      value: target,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        if (priceRef.current) {
          priceRef.current.textContent = Math.round(proxy.value).toString();
        }
      },
      onComplete: () => {
        displayedPrice.current = target;
      },
    });
  });

  return (
    <section
      ref={containerRef}
      className="flex w-full flex-col items-center gap-8 bg-slate-950 px-6 py-24 text-white"
    >
      <div className="flex items-center gap-4">
        <span className={`text-sm ${!isYearly ? "text-white" : "text-slate-500"}`}>Monthly</span>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={isYearly}
          className="relative h-7 w-14 rounded-full bg-slate-800"
        >
          <span
            ref={knobRef}
            className="absolute left-1 top-1 h-5 w-5 rounded-full bg-sky-400"
          />
        </button>
        <span className={`text-sm ${isYearly ? "text-white" : "text-slate-500"}`}>
          Yearly <span className="text-emerald-400">(save 30%)</span>
        </span>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-10 py-8 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-lg text-slate-400">$</span>
          <span ref={priceRef} className="text-5xl font-bold tabular-nums text-white">
            {MONTHLY_PRICE}
          </span>
          <span className="text-slate-400">/mo</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {isYearly ? "Billed annually" : "Billed monthly"}
        </p>
      </div>
    </section>
  );
}
