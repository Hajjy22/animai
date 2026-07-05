import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export type AnimaiConfig = {
  registry_url?: string;
  license_key?: string;
};

export function animaiHomeDir(): string {
  return path.join(os.homedir(), ".animai");
}

export function configPath(): string {
  return path.join(animaiHomeDir(), "config.json");
}

export function cacheDir(): string {
  return path.join(animaiHomeDir(), "cache");
}

export function loadConfig(): AnimaiConfig {
  try {
    const raw = readFileSync(configPath(), "utf8");
    const parsed = JSON.parse(raw) as AnimaiConfig;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveConfig(config: AnimaiConfig): void {
  mkdirSync(animaiHomeDir(), { recursive: true });
  writeFileSync(configPath(), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export function clearLicenseKey(): void {
  const config = loadConfig();
  delete config.license_key;
  saveConfig(config);
}

/**
 * The registry base URL, if remote mode is enabled. Resolution order:
 * `--registry` flag → `ANIMAI_REGISTRY_URL` env → config file. When none is
 * set we return undefined, which means "use the bundled local registry only"
 * — so the CLI works fully offline with zero network calls by default.
 */
export function resolveRegistryUrl(flagUrl?: string): string | undefined {
  const value = flagUrl ?? process.env.ANIMAI_REGISTRY_URL ?? loadConfig().registry_url;
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : undefined;
}

/**
 * The license key for pro components. Env wins over config so CI and agent
 * setups can inject it without writing to disk.
 */
export function resolveLicenseKey(): string | undefined {
  const value = process.env.ANIMAI_LICENSE_KEY ?? loadConfig().license_key;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function purgeCache(): void {
  try {
    rmSync(cacheDir(), { recursive: true, force: true });
  } catch {
    // best-effort
  }
}
