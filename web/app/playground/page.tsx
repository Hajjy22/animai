import { McpPlayground } from "@/components/McpPlayground";

export const metadata = {
  title: "MCP Playground — AnimAI",
  description: "Run the AnimAI MCP tools live, exactly as an AI coding agent would.",
};

export default function PlaygroundPage() {
  return (
    <div className="max-w-3xl">
      <p className="mb-3 text-sm font-medium uppercase tracking-wider text-sky-400">
        Live MCP demo
      </p>
      <h1 className="mb-3 text-3xl font-semibold text-white">MCP Playground</h1>
      <p className="mb-8 text-slate-300">
        This page calls the <span className="text-sky-300">real</span> AnimAI MCP
        server — the site spawns <code className="text-sky-300">animai mcp</code>{" "}
        over stdio and speaks the Model Context Protocol to it, exactly like
        Cursor or Claude Code do. Pick a tool, run it, and see the structured
        result your agent receives.
      </p>

      <McpPlayground />

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-white">Wire it into your agent</h2>
        <p className="mb-3 text-sm text-slate-400">
          The same two tools become available to your coding agent with this MCP
          config:
        </p>
        <pre className="overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300">
          <code>{`{
  "mcpServers": {
    "animai": { "command": "npx", "args": ["-y", "animai", "mcp"] }
  }
}`}</code>
        </pre>
      </section>
    </div>
  );
}
