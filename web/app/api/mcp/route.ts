import { NextResponse } from "next/server";
import { callMcpTool, listMcpTools } from "@/lib/mcp";

// This route runs the real MCP server as a subprocess, so it must use the
// Node runtime and never be statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TOOLS = new Set(["search_motion_library", "fetch_motion_component"]);

export async function GET() {
  try {
    return NextResponse.json({ tools: await listMcpTools() });
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { tool?: string; args?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const tool = body.tool ?? "";
  if (!ALLOWED_TOOLS.has(tool)) {
    return NextResponse.json(
      { error: `Unknown tool "${tool}". Allowed: ${[...ALLOWED_TOOLS].join(", ")}.` },
      { status: 400 },
    );
  }

  try {
    const started = Date.now();
    const result = await callMcpTool(tool, body.args ?? {});
    return NextResponse.json({
      tool,
      args: body.args ?? {},
      duration_ms: Date.now() - started,
      structured: result.structuredContent ?? null,
      content: result.content ?? null,
      isError: result.isError ?? false,
    });
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
