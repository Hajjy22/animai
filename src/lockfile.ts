import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Per-project record of what `animai add` installed: version + checksum at
 * install time, plus where the files went. `animai update` uses this to tell
 * "the registry moved on" apart from "the user hand-edited these files".
 */
export type LockEntry = {
  version: string;
  checksum: string;
  component_path: string;
  loader_path: string;
};

export type LockFile = Record<string, LockEntry>;

function lockFilePath(projectRoot: string): string {
  return path.join(projectRoot, ".animai", "installed.json");
}

export async function readLockFile(projectRoot: string): Promise<LockFile> {
  try {
    const raw = await readFile(lockFilePath(projectRoot), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as LockFile) : {};
  } catch {
    return {};
  }
}

export async function writeLockEntry(
  projectRoot: string,
  templateId: string,
  entry: LockEntry,
): Promise<void> {
  const lock = await readLockFile(projectRoot);
  lock[templateId] = {
    ...entry,
    // Always store posix separators so a lockfile written on Windows still
    // resolves on macOS/Linux/CI (path.resolve accepts "/" everywhere).
    component_path: toPosix(entry.component_path),
    loader_path: toPosix(entry.loader_path),
  };
  const file = lockFilePath(projectRoot);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}
