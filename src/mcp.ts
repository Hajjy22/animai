import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { resolveLicenseKey, resolveRegistryUrl } from "./config.js";
import { createRegistrySource } from "./registry-client.js";
import { createMotionTools } from "./mcp-tools.js";

export async function runMcpServer(): Promise<void> {
  const server = new McpServer({
    name: "animai",
    version: "0.1.0",
  });

  // The agent's environment supplies the registry URL and license key, so a
  // single MCP config line stays enough. No URL configured = local bundle.
  const source = createRegistrySource({
    registryUrl: resolveRegistryUrl(),
    licenseKey: resolveLicenseKey(),
  });

  for (const tool of createMotionTools(source)) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      },
      async (args: Record<string, unknown>) => {
        const result = await tool.handler(args);
        // The SDK derives a stricter callback return type from outputSchema;
        // our shared handler produces the same runtime shape.
        return result as unknown as CallToolResult;
      },
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AnimAI MCP server running on stdio");
}
