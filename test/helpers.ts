import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/** A fresh throwaway directory, auto-registered for cleanup after the test. */
export function tempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), `animai-test-${prefix}-`));
  return dir;
}

export function cleanupDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/** Writes a minimal Next.js route file with a <main> wrapper. */
export function writeBasicRoute(projectRoot: string, jsx = "<p>hi</p>"): string {
  const appDir = path.join(projectRoot, "app");
  mkdirSync(appDir, { recursive: true });
  const routePath = path.join(appDir, "page.tsx");
  const source = `export default function Home() {\n  return (\n    <main>\n      ${jsx}\n    </main>\n  );\n}\n`;
  writeFileSync(routePath, source, "utf8");
  return routePath;
}
