import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free and Pro plans for production-safe 3D & motion components. Pro starts at $59/yr for founding members.",
};

const FREE_FEATURES = [
  "6 free components",
  "CLI & MCP server",
  "AST-safe code injection",
  "Static vetting reports",
  "Community support",
];

const PRO_FEATURES = [
  "Everything in Free",
  "All Pro components",
  "Priority component updates",
  "Commercial license",
  "Runtime vetting reports (coming soon)",
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Start free. Upgrade when you need Pro components.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Free tier */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
          <h2 className="text-lg font-semibold text-white">Free</h2>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">$0</span>
            <span className="text-slate-400">/ forever</span>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Get started with vetted, leak-free components — no account needed.
          </p>
          <ul className="mt-8 flex-1 space-y-3">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-0.5 text-emerald-400">&#10003;</span>
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/docs"
            className="mt-8 block rounded-lg border border-slate-700 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Get started
          </Link>
        </div>

        {/* Pro tier */}
        <div className="relative flex flex-col rounded-2xl border border-sky-500/50 bg-sky-500/5 p-8">
          <div className="absolute -top-3 right-6 rounded-full bg-sky-500 px-3 py-0.5 text-xs font-semibold text-slate-950">
            Founding offer — 40% off
          </div>
          <h2 className="text-lg font-semibold text-white">Pro</h2>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">$59</span>
            <span className="text-slate-400">/ year</span>
            <span className="text-sm text-slate-500 line-through">$99</span>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Unlock every component with a single license key across CLI and MCP.
          </p>
          <ul className="mt-8 flex-1 space-y-3">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-0.5 text-sky-400">&#10003;</span>
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="https://tally.so/r/REPLACE_WITH_YOUR_FORM_ID"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 block rounded-lg bg-sky-500 py-3 text-center text-sm font-medium text-slate-950 transition hover:bg-sky-400"
          >
            Join the waitlist
          </a>
          <p className="mt-3 text-center text-xs text-slate-500">
            We&apos;ll notify you when Pro launches. No charge until then.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center">
        <p className="text-sm text-slate-400">
          Every component — free and pro — is certified leak-free, SSR-safe, and
          performance-budgeted by our{" "}
          <Link href="/docs" className="text-sky-400 hover:underline">
            vetting harness
          </Link>
          . The source is open; the registry is the product.
        </p>
      </div>
    </div>
  );
}
