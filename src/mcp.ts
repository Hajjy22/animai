import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { resolveLicenseKey, resolveRegistryUrl } from "./config.js";
import { createRegistrySource, RegistryError } from "./registry-client.js";
import { DEFAULT_TEMPLATE_ID } from "./registry.js";

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

  server.registerTool(
    "search_motion_library",
    {
      title: "Search Motion Library",
      description:
        "Searches the AnimAI registry of vetted, leak-free, SSR-safe 3D and motion components (React Three Fiber, GSAP) for Next.js.",
      inputSchema: {
        query: z.string().describe("Flat natural-language motion query."),
        limit: z.number().int().min(1).max(10).optional().describe("Flat result limit."),
      },
      outputSchema: {
        query: z.string(),
        result_count: z.number(),
        results_json: z.string(),
      },
    },
    async ({ query, limit = 5 }) => {
      const results = await source.search(query, limit);
      const structuredContent = {
        query,
        result_count: results.length,
        results_json: JSON.stringify(results),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(structuredContent, null, 2),
          },
        ],
        structuredContent,
      };
    },
  );

  server.registerTool(
    "fetch_motion_component",
    {
      title: "Fetch Motion Component",
      description:
        "Returns the deterministic, pre-vetted source for one component: files to write, dependencies to install, and integration instructions. Never generate 3D/motion code from scratch when a vetted component matches.",
      inputSchema: {
        template_id: z
          .string()
          .optional()
          .describe("Flat template id. Defaults to hero-orbital-rig."),
        target_framework: z
          .enum(["nextjs-r3f"])
          .optional()
          .describe("Flat target framework selector. nextjs-r3f (Next.js App Router) is currently supported."),
      },
      outputSchema: {
        template_id: z.string(),
        title: z.string(),
        summary: z.string(),
        framework: z.string(),
        component_filename: z.string(),
        loader_filename: z.string(),
        loader_export: z.string(),
        dependencies: z.array(z.string()),
        integration_instructions: z.array(z.string()),
        target_code: z.string(),
        loader_code: z.string(),
      },
    },
    async ({ template_id = DEFAULT_TEMPLATE_ID, target_framework = "nextjs-r3f" }) => {
      void target_framework;

      let payload;
      try {
        payload = await source.fetch(template_id);
      } catch (error) {
        if (error instanceof RegistryError) {
          const detail = error.upgradeUrl ? `${error.message} (${error.upgradeUrl})` : error.message;
          return {
            isError: true,
            content: [{ type: "text", text: detail }],
          };
        }
        throw error;
      }

      const structuredContent = {
        template_id: payload.template_id,
        title: payload.title,
        summary: payload.summary,
        framework: payload.framework,
        component_filename: payload.component_filename,
        loader_filename: payload.loader_filename,
        loader_export: payload.loader_export,
        dependencies: [...payload.dependencies],
        integration_instructions: [...payload.integration_instructions],
        target_code: payload.target_code,
        loader_code: payload.loader_code,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(structuredContent, null, 2),
          },
        ],
        structuredContent,
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AnimAI MCP server running on stdio");
}
