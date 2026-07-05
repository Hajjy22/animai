"use client";

import { useState } from "react";

type ToolName = "search_motion_library" | "fetch_motion_component";

type McpResponse = {
  tool: string;
  args: Record<string, unknown>;
  duration_ms: number;
  structured: unknown;
  content: unknown;
  isError: boolean;
  error?: string;
};

const TOOLS: { name: ToolName; label: string; hint: string }[] = [
  {
    name: "search_motion_library",
    label: "search_motion_library",
    hint: "Natural-language query, e.g. “dark 3d hero” or “scroll reveal”.",
  },
  {
    name: "fetch_motion_component",
    label: "fetch_motion_component",
    hint: "A template id, e.g. hero-orbital-rig.",
  },
];

export function McpPlayground() {
  const [tool, setTool] = useState<ToolName>("search_motion_library");
  const [input, setInput] = useState("dark 3d hero");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<McpResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = TOOLS.find((t) => t.name === tool)!;

  const args =
    tool === "search_motion_library"
      ? { query: input, limit: 5 }
      : { template_id: input };

  const run = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tool, args }),
      });
      const data = (await res.json()) as McpResponse;
      if (!res.ok) {
        setError(data.error ?? "Request failed.");
      } else {
        setResponse(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const onToolChange = (next: ToolName) => {
    setTool(next);
    setInput(next === "search_motion_library" ? "dark 3d hero" : "hero-orbital-rig");
    setResponse(null);
    setError(null);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Tool
        </span>
        {TOOLS.map((t) => (
          <button
            key={t.name}
            onClick={() => onToolChange(t.name)}
            className={`rounded-md px-3 py-1 font-mono text-xs transition ${
              tool === t.name
                ? "bg-sky-500 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        <label className="mb-1.5 block text-xs text-slate-500">{active.hint}</label>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-sky-500"
          />
          <button
            onClick={run}
            disabled={loading}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
          >
            {loading ? "Calling…" : "Run tool"}
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">
            Agent → MCP
          </div>
          <pre className="overflow-auto rounded-lg border border-slate-800 bg-black/40 p-3 text-xs text-emerald-300">
            <code>{`${tool}(${JSON.stringify(args)})`}</code>
          </pre>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        {response ? (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wider text-slate-500">
              <span>MCP → Agent (structured result)</span>
              <span className="text-slate-600">{response.duration_ms} ms</span>
            </div>
            <pre className="max-h-96 overflow-auto rounded-lg border border-slate-800 bg-black/40 p-3 text-xs leading-relaxed text-slate-300">
              <code>{JSON.stringify(response.structured, null, 2)}</code>
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
