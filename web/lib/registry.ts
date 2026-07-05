import { readFileSync } from "node:fs";
import path from "node:path";

// The site dogfoods the registry: it reads the same cdn/ artifacts the CLI and
// MCP clients consume. `npm run build:cdn` (wired as predev/prebuild) regenerates
// them from registry/ before the site builds.
const cdnDir = path.resolve(process.cwd(), "..", "cdn");

export type VettingReport = {
  dispose_audit: string;
  ssr_safe: boolean;
  vram_leak: boolean;
  fps_budget: number;
  measured_fps: number | null;
  method: string;
  verified_at: string | null;
  harness_version: string | null;
};

export type IndexRecord = {
  template_id: string;
  title: string;
  summary: string;
  framework: string;
  tier: "free" | "pro";
  tags: string[];
  add_command: string;
};

export type ComponentDetail = {
  template_id: string;
  version: string;
  tier: "free" | "pro";
  title: string;
  summary: string;
  framework: string;
  framework_targets: string[];
  dependencies: string[];
  peer_dep_ranges: Record<string, string>;
  integration_instructions: string[];
  vetting_report: VettingReport;
  tags: string[];
  locked?: boolean;
  target_code?: string;
  loader_code?: string;
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

export function getIndex(): IndexRecord[] {
  return readJson<IndexRecord[]>(path.join(cdnDir, "index.json"));
}

export function getComponent(id: string): ComponentDetail | null {
  try {
    return readJson<ComponentDetail>(path.join(cdnDir, "components", `${id}.json`));
  } catch {
    return null;
  }
}

export function getComponentIds(): string[] {
  return getIndex().map((entry) => entry.template_id);
}
