import type { VettingReport } from "@/lib/registry";

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ring-1 ${
        ok
          ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
          : "bg-rose-400/10 text-rose-300 ring-rose-400/25"
      }`}
    >
      <span aria-hidden>{ok ? "✓" : "✗"}</span>
      {label}
    </span>
  );
}

export function VettingBadges({ report }: { report: VettingReport }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Check ok={report.dispose_audit === "pass"} label="Dispose audit" />
      <Check ok={report.ssr_safe} label="SSR safe" />
      <Check ok={!report.vram_leak} label="No VRAM leak" />
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-700/40 px-2 py-1 text-xs text-slate-300 ring-1 ring-slate-600/40">
        FPS budget {report.fps_budget}
      </span>
    </div>
  );
}
