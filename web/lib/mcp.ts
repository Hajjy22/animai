import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// The site is a live demo of the MCP server: this bridge spawns the real
// `animai mcp` process over stdio and talks to it with the MCP SDK, exactly as
// Cursor / Claude Code would. The connected client is cached on globalThis so a
// single subprocess is reused across requests (and survives Next dev reloads).

type McpGlobal = { client?: Promise<Client> };
const store = globalThis as unknown as { __animaiMcp?: McpGlobal };
store.__animaiMcp ??= {};

function cliEntry(): string {
  // Next runs with cwd = web/, so the built CLI is one level up.
  return path.resolve(process.cwd(), "..", "dist", "index.js");
}

async function getClient(): Promise<Client> {
  const cache = store.__animaiMcp as McpGlobal;
  if (!cache.client) {
    cache.client = (async () => {
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [cliEntry(), "mcp"],
      });
      const client = new Client({ name: "animai-web-playground", version: "0.1.0" });
      await client.connect(transport);
      return client;
    })().catch((error) => {
      // Allow a later request to retry the spawn instead of caching the failure.
      cache.client = undefined;
      throw error;
    });
  }
  return cache.client;
}

export async function listMcpTools() {
  const client = await getClient();
  const { tools } = await client.listTools();
  return tools.map((tool) => ({ name: tool.name, description: tool.description ?? "" }));
}

export async function callMcpTool(name: string, args: Record<string, unknown>) {
  const client = await getClient();
  const result = await client.callTool({ name, arguments: args });
  return result;
}
