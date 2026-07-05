import { CopyBlock } from "@/components/CopyBlock";

const MCP_SNIPPET = `{
  "mcpServers": {
    "animai": {
      "command": "npx",
      "args": ["-y", "animai", "mcp"],
      "env": { "ANIMAI_LICENSE_KEY": "your-key-here" }
    }
  }
}`;

export default function DocsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-3xl font-semibold text-white">Docs</h1>
      <p className="mb-10 text-slate-300">
        AnimAI ships as a CLI and an MCP server. Use the CLI directly, or wire
        the MCP server into your AI coding agent so it can discover and inject
        vetted components on demand.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-white">CLI</h2>
        <div className="grid gap-3">
          <CopyBlock label="Search" command={'npx animai search "3d hero"'} />
          <CopyBlock label="Add a component" command="npx animai add hero-orbital-rig" />
          <CopyBlock label="Check peer deps" command="npx animai doctor hero-orbital-rig" />
          <CopyBlock label="Update to the latest version" command="npx animai update hero-orbital-rig" />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-white">MCP server</h2>
        <p className="mb-4 text-slate-300">
          Add this to your agent&apos;s MCP config (Cursor, Claude Code, Windsurf).
          The agent gets two tools: <code className="text-sky-300">search_motion_library</code> and{" "}
          <code className="text-sky-300">fetch_motion_component</code>.
        </p>
        <pre className="overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-5 text-xs leading-relaxed text-slate-300">
          <code>{MCP_SNIPPET}</code>
        </pre>
      </section>

      <section id="pro" className="mb-10 scroll-mt-24">
        <h2 className="mb-3 text-xl font-semibold text-white">Pro license</h2>
        <p className="mb-4 text-slate-300">
          Free components install with no account. Pro components require a
          license key — save it once and every CLI and MCP call is authorized.
        </p>
        <div className="grid gap-3">
          <CopyBlock label="Save your key" command="npx animai login your-license-key" />
          <CopyBlock label="Or via environment" command="export ANIMAI_LICENSE_KEY=your-license-key" />
        </div>
      </section>
    </div>
  );
}
