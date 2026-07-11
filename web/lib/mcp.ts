import { createRegistrySource } from "animai/registry-client";
import { resolveLicenseKey, resolveRegistryUrl } from "animai/config";
import { createMotionTools, type MotionTool } from "animai/mcp-tools";

// The playground is a live demo of the MCP server. Rather than spawn a
// subprocess (which cannot run in a serverless function), it calls the exact
// same tool handlers in-process — identical output to `animai mcp` over stdio.
// The tools are cached on globalThis so the registry source (and its disk
// cache) is reused across requests and survives Next dev reloads.

type McpGlobal = { tools?: MotionTool[] };
const store = globalThis as unknown as { __animaiMcp?: McpGlobal };
store.__animaiMcp ??= {};

function getTools(): MotionTool[] {
  const cache = store.__animaiMcp as McpGlobal;
  if (!cache.tools) {
    const source = createRegistrySource({
      registryUrl: resolveRegistryUrl(),
      licenseKey: resolveLicenseKey(),
    });
    cache.tools = createMotionTools(source);
  }
  return cache.tools;
}

export async function listMcpTools() {
  return getTools().map((tool) => ({ name: tool.name, description: tool.description }));
}

export async function callMcpTool(name: string, args: Record<string, unknown>) {
  const tool = getTools().find((candidate) => candidate.name === name);
  if (!tool) {
    throw new Error(`Unknown tool "${name}".`);
  }
  return tool.handler(args);
}
