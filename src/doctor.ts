import { readFile } from "node:fs/promises";
import path from "node:path";
import { satisfiesRange } from "./semver.js";
import type { RegistryEntry } from "./registry-types.js";

export type DoctorCheck = {
  dependency: string;
  required_range: string;
  installed_version: string | null;
  status: "ok" | "mismatch" | "missing" | "unknown";
};

export type DoctorReport = {
  template_id: string;
  checks: DoctorCheck[];
  all_ok: boolean;
};

export async function runDoctor(
  entry: RegistryEntry,
  projectRoot: string,
): Promise<DoctorReport> {
  const dependencyNames = Object.keys(entry.peer_dep_ranges);
  const checks = await Promise.all(
    dependencyNames.map((dependency) =>
      checkDependency(dependency, entry.peer_dep_ranges[dependency], projectRoot),
    ),
  );

  return {
    template_id: entry.template_id,
    checks,
    all_ok: checks.every((check) => check.status === "ok" || check.status === "unknown"),
  };
}

async function checkDependency(
  dependency: string,
  requiredRange: string,
  projectRoot: string,
): Promise<DoctorCheck> {
  const installedVersion = await readInstalledVersion(dependency, projectRoot);

  if (installedVersion === null) {
    return {
      dependency,
      required_range: requiredRange,
      installed_version: null,
      status: "missing",
    };
  }

  const satisfies = satisfiesRange(installedVersion, requiredRange);
  return {
    dependency,
    required_range: requiredRange,
    installed_version: installedVersion,
    status: satisfies === null ? "unknown" : satisfies ? "ok" : "mismatch",
  };
}

async function readInstalledVersion(
  dependency: string,
  projectRoot: string,
): Promise<string | null> {
  const manifestPath = path.join(projectRoot, "node_modules", dependency, "package.json");
  try {
    const raw = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as { version?: string };
    return typeof parsed.version === "string" ? parsed.version : null;
  } catch {
    return null;
  }
}
