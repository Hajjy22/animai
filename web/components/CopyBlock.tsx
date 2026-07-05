"use client";

import { useState } from "react";

export function CopyBlock({ label, command }: { label?: string; command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable; ignore
    }
  };

  return (
    <div>
      {label ? (
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-sm">
        <code className="truncate text-slate-200">{command}</code>
        <button
          onClick={copy}
          className="shrink-0 rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
