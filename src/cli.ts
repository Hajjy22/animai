import path from "node:path";
import process from "node:process";
import {
  clearLicenseKey,
  loadConfig,
  purgeCache,
  resolveLicenseKey,
  resolveRegistryUrl,
  saveConfig,
} from "./config.js";
import { runDoctor } from "./doctor.js";
import { addMotionComponent } from "./inject.js";
import { createRegistrySource, RegistryError } from "./registry-client.js";
import type { RegistrySource } from "./registry-client.js";
import { DEFAULT_TEMPLATE_ID } from "./registry.js";
import { updateMotionComponent } from "./update.js";

type ParsedArgs = {
  command: string;
  positionals: string[];
  flags: Record<string, string | boolean>;
};

export async function runCli(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);

  try {
    await dispatch(parsed);
  } catch (error) {
    if (error instanceof RegistryError) {
      console.error(`AnimAI: ${error.message}`);
      if (error.upgradeUrl) {
        console.error(`Upgrade: ${error.upgradeUrl}`);
      }
      process.exit(1);
    }
    throw error;
  }
}

async function dispatch(parsed: ParsedArgs): Promise<void> {
  switch (parsed.command) {
    case "":
    case "help":
    case "--help":
    case "-h":
      printHelp();
      return;
    case "login":
      runLogin(parsed);
      return;
    case "logout":
      runLogout();
      return;
    case "list":
      await runList(parsed);
      return;
    case "search":
      await runSearch(parsed);
      return;
    case "fetch":
      await runFetch(parsed);
      return;
    case "add":
      await runAdd(parsed);
      return;
    case "doctor":
      await runDoctorCommand(parsed);
      return;
    case "update":
      await runUpdate(parsed);
      return;
    default:
      throw new Error(`Unknown command: ${parsed.command}`);
  }
}

function sourceFor(parsed: ParsedArgs): RegistrySource {
  return createRegistrySource({
    registryUrl: resolveRegistryUrl(readOptionalStringFlag(parsed.flags.registry)),
    licenseKey: resolveLicenseKey(),
    offline: Boolean(parsed.flags.offline),
  });
}

function runLogin(parsed: ParsedArgs): void {
  const key = parsed.positionals[0] ?? readOptionalStringFlag(parsed.flags.key);
  if (!key) {
    throw new Error("Usage: animai login <license-key>");
  }
  const config = loadConfig();
  config.license_key = key;
  const registry = readOptionalStringFlag(parsed.flags.registry);
  if (registry) {
    config.registry_url = registry;
  }
  saveConfig(config);
  console.log("Saved license key to ~/.animai/config.json.");
}

function runLogout(): void {
  clearLicenseKey();
  purgeCache();
  console.log("Cleared license key and cached registry data.");
}

async function runList(parsed: ParsedArgs): Promise<void> {
  const source = sourceFor(parsed);
  printJson(await source.list());
}

async function runSearch(parsed: ParsedArgs): Promise<void> {
  const query = parsed.positionals.join(" ").trim() || "hero 3d";
  const limit = readNumberFlag(parsed.flags.limit, 5);
  const results = await sourceFor(parsed).search(query, limit);

  if (parsed.flags.json) {
    printJson(results);
    return;
  }

  console.log(`AnimAI results for "${query}"`);
  for (const result of results) {
    console.log("");
    console.log(`${result.template_id} [${result.tier}] - ${result.title}`);
    console.log(result.summary);
    console.log(`Try: ${result.add_command}`);
  }
}

async function runFetch(parsed: ParsedArgs): Promise<void> {
  const templateId = parsed.positionals[0] ?? DEFAULT_TEMPLATE_ID;
  const payload = await sourceFor(parsed).fetch(templateId);
  printJson({
    template_id: payload.template_id,
    title: payload.title,
    summary: payload.summary,
    framework: payload.framework,
    component_filename: payload.component_filename,
    loader_filename: payload.loader_filename,
    loader_export: payload.loader_export,
    dependencies: payload.dependencies,
    integration_instructions: payload.integration_instructions,
    target_code: payload.target_code,
    loader_code: payload.loader_code,
  });
}

async function runAdd(parsed: ParsedArgs): Promise<void> {
  const templateId = parsed.positionals[0] ?? DEFAULT_TEMPLATE_ID;
  const cwd = readStringFlag(parsed.flags.cwd, process.cwd());
  const componentsDir = readStringFlag(parsed.flags.path, "app/components");
  const routePath = readStringFlag(parsed.flags.route, "app/page.tsx");
  const dryRun = Boolean(parsed.flags["dry-run"]);
  const target = readOptionalStringFlag(parsed.flags.target);

  const result = await addMotionComponent({
    cwd,
    templateId,
    componentsDir,
    routePath,
    dryRun,
    target,
    source: sourceFor(parsed),
  });

  if (parsed.flags.json) {
    printJson(result);
    return;
  }

  console.log(`AnimAI ${dryRun ? "planned" : "added"} ${result.template_id}`);
  console.log(`Component: ${result.component_path}`);
  console.log(`Loader: ${result.loader_path}`);
  console.log(`Route: ${result.route_path}`);
  console.log(`Dependencies: ${result.dependency_command}`);

  if (dryRun) {
    console.log("");
    console.log("Route preview:");
    console.log(result.route_patch_preview);
  }
}

async function runUpdate(parsed: ParsedArgs): Promise<void> {
  const templateId = parsed.positionals[0] ?? DEFAULT_TEMPLATE_ID;
  const cwd = readStringFlag(parsed.flags.cwd, process.cwd());
  const componentsDir = readStringFlag(parsed.flags.path, "app/components");
  const routePath = readStringFlag(parsed.flags.route, "app/page.tsx");
  const dryRun = Boolean(parsed.flags["dry-run"]);
  const force = Boolean(parsed.flags.force);

  const result = await updateMotionComponent({
    cwd,
    templateId,
    componentsDir,
    routePath,
    dryRun,
    force,
    source: sourceFor(parsed),
  });

  if (parsed.flags.json) {
    printJson(result);
  } else {
    switch (result.status) {
      case "up_to_date":
        console.log(`AnimAI: ${result.template_id} is already up to date (v${result.version}).`);
        break;
      case "not_installed":
      case "local_changes":
        console.log(`AnimAI: ${result.message}`);
        break;
      case "updated":
        console.log(
          `AnimAI ${dryRun ? "would update" : "updated"} ${result.template_id}` +
            (result.from_version ? ` from v${result.from_version}` : "") +
            ` to v${result.to_version}.`,
        );
        console.log(`Component: ${result.component_path}`);
        console.log(`Loader: ${result.loader_path}`);
        break;
    }
  }

  if (result.status === "not_installed" || result.status === "local_changes") {
    process.exit(1);
  }
}

async function runDoctorCommand(parsed: ParsedArgs): Promise<void> {
  const templateId = parsed.positionals[0] ?? DEFAULT_TEMPLATE_ID;
  const cwd = readStringFlag(parsed.flags.cwd, process.cwd());
  const entry = await sourceFor(parsed).fetch(templateId);
  const report = await runDoctor(entry, path.resolve(cwd));

  if (parsed.flags.json) {
    printJson(report);
    if (!report.all_ok) {
      process.exit(1);
    }
    return;
  }

  console.log(`AnimAI doctor: ${report.template_id}`);
  for (const check of report.checks) {
    const label =
      check.status === "ok"
        ? "ok   "
        : check.status === "mismatch"
          ? "FAIL "
          : check.status === "missing"
            ? "FAIL "
            : "warn ";
    const installed = check.installed_version ?? "not installed";
    console.log(`  [${label}] ${check.dependency}: needs ${check.required_range}, found ${installed}`);
  }

  if (!report.all_ok) {
    console.log("");
    console.log("Some peer dependencies do not satisfy this component's requirements.");
    process.exit(1);
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command = "", ...rest] = argv;
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < rest.length; index += 1) {
    const item = rest[index];

    if (!item.startsWith("--")) {
      positionals.push(item);
      continue;
    }

    const flagName = item.slice(2);
    const next = rest[index + 1];

    if (!next || next.startsWith("--")) {
      flags[flagName] = true;
      continue;
    }

    flags[flagName] = next;
    index += 1;
  }

  return {
    command,
    positionals,
    flags,
  };
}

function readStringFlag(value: string | boolean | undefined, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function readOptionalStringFlag(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readNumberFlag(value: string | boolean | undefined, fallback: number): number {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printHelp(): void {
  console.log(`AnimAI demo CLI

Usage:
  animai search "dark mode 3d hero"
  animai fetch ${DEFAULT_TEMPLATE_ID}
  animai add ${DEFAULT_TEMPLATE_ID} --cwd ./examples/next-demo
  animai add ${DEFAULT_TEMPLATE_ID} --cwd ./examples/next-demo --dry-run
  animai add ${DEFAULT_TEMPLATE_ID} --cwd ./examples/next-demo --target main
  animai doctor ${DEFAULT_TEMPLATE_ID} --cwd ./examples/next-demo
  animai update ${DEFAULT_TEMPLATE_ID} --cwd ./examples/next-demo
  animai login <license-key>
  animai mcp

Commands:
  login    Save a Pro license key to ~/.animai/config.json.
  logout   Clear the saved license key and cached registry data.
  list     List every component in the registry.
  search   Search the registry.
  fetch    Print a deterministic integration payload.
  add      Write component files and patch a Next route with AST edits.
  update   Re-fetch a previously-added component and apply the latest version.
  doctor   Check a project's installed peer dependencies against a component's requirements.
  mcp      Start the MCP server over stdio for Cursor/Claude-style clients.

Update flags:
  --force  Overwrite even if local files look hand-edited or have no install record.

Add flags:
  --cwd <dir>       Target project root (default: current directory).
  --path <dir>      Components directory (default: app/components).
  --route <file>    Route file to patch (default: app/page.tsx).
  --target <tag>    JSX wrapper tag to inject into (default: auto-detect <main> or outermost element).
  --dry-run         Preview the patch without writing files.
  --json            Emit machine-readable JSON.

Registry flags (list/search/fetch/add):
  --registry <url>  Remote registry base URL (default: ANIMAI_REGISTRY_URL or local bundle).
  --offline         Force the bundled local registry, skipping any network.
`);
}
