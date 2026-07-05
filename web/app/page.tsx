import Link from "next/link";
import { getIndex } from "@/lib/registry";
import { TierBadge } from "@/components/TierBadge";

export default function BrowsePage() {
  const components = getIndex();

  return (
    <div>
      <section className="mb-14">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-sky-400">
          shadcn for 3D &amp; motion
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Production-safe 3D &amp; motion components your AI agent can install.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          Every component is certified leak-free, SSR-safe, and
          performance-budgeted by our vetting harness — then injected into your
          Next.js app with AST-safe edits via the CLI or MCP server.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 font-mono text-sm text-slate-200">
            <span className="text-slate-500">$</span>
            npx animai add hero-orbital-rig
          </div>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-300 hover:bg-sky-500/20"
          >
            Try the live MCP playground →
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-sm font-medium uppercase tracking-wider text-slate-400">
          {components.length} components
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {components.map((component) => (
            <Link
              key={component.template_id}
              href={`/components/${component.template_id}`}
              className="group flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-sky-500/50 hover:bg-slate-900/80"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-white group-hover:text-sky-300">
                  {component.title}
                </h3>
                <TierBadge tier={component.tier} />
              </div>
              <p className="mb-4 flex-1 text-sm text-slate-400">
                {component.summary}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {component.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
