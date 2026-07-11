import { z } from "zod";
import { RegistryError, type RegistrySource } from "./registry-client.js";
import { DEFAULT_TEMPLATE_ID } from "./registry.js";

// Single source of truth for the two AnimAI MCP tools. Both the stdio MCP
// server (src/mcp.ts) and the web playground (web/lib/mcp.ts) consume these, so
// the tool contract and output shape stay identical across surfaces.

export type McpToolContent = { type: "text"; text: string };

export type McpToolResult = {
  content: McpToolContent[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

export type MotionTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: z.ZodRawShape;
  outputSchema: z.ZodRawShape;
  handler: (args: Record<string, unknown>) => Promise<McpToolResult>;
};

const searchInput = {
  query: z.string().describe("Flat natural-language motion query."),
  limit: z.number().int().min(1).max(10).optional().describe("Flat result limit."),
};

const searchOutput = {
  query: z.string(),
  result_count: z.number(),
  results_json: z.string(),
};

const fetchInput = {
  template_id: z
    .string()
    .optional()
    .describe("Flat template id. Defaults to hero-orbital-rig."),
  target_framework: z
    .enum(["nextjs-r3f"])
    .optional()
    .describe(
      "Flat target framework selector. nextjs-r3f (Next.js App Router) is currently supported.",
    ),
};

const fetchOutput = {
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
};

function textResult(structuredContent: Record<string, unknown>): McpToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
  };
}

export function createMotionTools(source: RegistrySource): MotionTool[] {
  return [
    {
      name: "search_motion_library",
      title: "Search Motion Library",
      description:
        "Searches the AnimAI registry of vetted, leak-free, SSR-safe 3D and motion components (React Three Fiber, GSAP) for Next.js.",
      inputSchema: searchInput,
      outputSchema: searchOutput,
      async handler(args) {
        const { query, limit = 5 } = z.object(searchInput).parse(args);
        const results = await source.search(query, limit);
        return textResult({
          query,
          result_count: results.length,
          results_json: JSON.stringify(results),
        });
      },
    },
    {
      name: "fetch_motion_component",
      title: "Fetch Motion Component",
      description:
        "Returns the deterministic, pre-vetted source for one component: files to write, dependencies to install, and integration instructions. Never generate 3D/motion code from scratch when a vetted component matches.",
      inputSchema: fetchInput,
      outputSchema: fetchOutput,
      async handler(args) {
        const { template_id = DEFAULT_TEMPLATE_ID, target_framework = "nextjs-r3f" } =
          z.object(fetchInput).parse(args);
        void target_framework;

        let payload;
        try {
          payload = await source.fetch(template_id);
        } catch (error) {
          if (error instanceof RegistryError) {
            const detail = error.upgradeUrl
              ? `${error.message} (${error.upgradeUrl})`
              : error.message;
            return { isError: true, content: [{ type: "text", text: detail }] };
          }
          throw error;
        }

        return textResult({
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
        });
      },
    },
  ];
}
