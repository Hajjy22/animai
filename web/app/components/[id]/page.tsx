import Link from "next/link";
import { notFound } from "next/navigation";
import { getComponent, getComponentIds } from "@/lib/registry";
import { TierBadge } from "@/components/TierBadge";
import { VettingBadges } from "@/components/VettingBadges";
import { CopyBlock } from "@/components/CopyBlock";
import { FpsMeter } from "@/components/FpsMeter";

export function generateStaticParams() {
  return getComponentIds().map((id) => ({ id }));
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const component = getComponent(id);
  if (!component) {
    notFound();
  }

  return (
    <div>
      <Link href="/" className="text-sm text-slate-400 hover:text-white">
        ← All components
      </Link>

      <div className="mt-4 mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-white">{component.title}</h1>
            <TierBadge tier={component.tier} />
          </div>
          <p className="max-w-2xl text-slate-300">{component.summary}</p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
          Vetting report
          <span className="ml-2 font-normal normal-case text-slate-500">
            harness v{component.vetting_report.harness_version ?? "—"} · method:{" "}
            {component.vetting_report.method}
          </span>
        </h2>
        <VettingBadges report={component.vetting_report} />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
          Live meter
        </h2>
        <FpsMeter />
      </section>

      <section className="mb-8 grid gap-3 sm:max-w-xl">
        <CopyBlock label="CLI" command={`npx animai add ${component.template_id}`} />
        <CopyBlock
          label="Dependencies"
          command={`npm install ${component.dependencies.join(" ")}`}
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
          Source
        </h2>
        {component.locked ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
            <p className="font-medium text-amber-200">This is a Pro component.</p>
            <p className="mt-1 text-sm text-amber-100/70">
              The vetting report and integration details are public, but the
              source is delivered only to license holders through the CLI and
              MCP server.
            </p>
            <a
              href="/docs#pro"
              className="mt-4 inline-block rounded-md bg-amber-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-300"
            >
              Get a license
            </a>
          </div>
        ) : (
          <pre className="max-h-[28rem] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-5 text-xs leading-relaxed text-slate-300">
            <code>{component.target_code}</code>
          </pre>
        )}
      </section>
    </div>
  );
}
