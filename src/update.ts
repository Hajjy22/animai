import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { computeChecksum } from "./checksum.js";
import { assertInside, patchNextRouteSource, toRouteImportPath } from "./inject.js";
import { readLockFile, writeLockEntry } from "./lockfile.js";
import type { RegistrySource } from "./registry-client.js";

export type UpdateOptions = {
  cwd: string;
  templateId: string;
  componentsDir: string;
  routePath: string;
  dryRun: boolean;
  force: boolean;
  source: RegistrySource;
};

export type UpdateResult =
  | { status: "up_to_date"; template_id: string; version: string }
  | { status: "not_installed"; template_id: string; message: string }
  | { status: "local_changes"; template_id: string; message: string }
  | {
      status: "updated";
      template_id: string;
      from_version: string | null;
      to_version: string;
      component_path: string;
      loader_path: string;
      patched_route: boolean;
    };

async function readOptional(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function updateMotionComponent(options: UpdateOptions): Promise<UpdateResult> {
  const projectRoot = path.resolve(options.cwd);
  const lock = await readLockFile(projectRoot);
  const lockEntry = lock[options.templateId];
  const entry = await options.source.fetch(options.templateId);

  const componentPath = path.resolve(
    projectRoot,
    lockEntry?.component_path ?? path.join(options.componentsDir, entry.component_filename),
  );
  const loaderPath = path.resolve(
    projectRoot,
    lockEntry?.loader_path ?? path.join(options.componentsDir, entry.loader_filename),
  );
  assertInside(projectRoot, componentPath);
  assertInside(projectRoot, loaderPath);

  const onDiskComponent = await readOptional(componentPath);
  const onDiskLoader = await readOptional(loaderPath);
  const filesExist = onDiskComponent !== null && onDiskLoader !== null;

  if (!lockEntry && !filesExist) {
    return {
      status: "not_installed",
      template_id: options.templateId,
      message: `"${options.templateId}" was not found installed in this project. Run \`animai add ${options.templateId}\` first.`,
    };
  }

  if (lockEntry && entry.checksum === lockEntry.checksum) {
    return { status: "up_to_date", template_id: options.templateId, version: entry.version };
  }

  if (lockEntry && filesExist && !options.force) {
    const localChecksum = computeChecksum(onDiskComponent, onDiskLoader);
    if (localChecksum !== lockEntry.checksum) {
      return {
        status: "local_changes",
        template_id: options.templateId,
        message: `Local files for "${options.templateId}" differ from what was installed (v${lockEntry.version}) — they look hand-edited. Re-run with --force to overwrite anyway.`,
      };
    }
  }

  if (!lockEntry && filesExist && !options.force) {
    return {
      status: "local_changes",
      template_id: options.templateId,
      message: `Found existing files for "${options.templateId}" with no install record — cannot confirm they are unmodified. Re-run with --force to overwrite anyway.`,
    };
  }

  const routePath = path.resolve(projectRoot, options.routePath);
  assertInside(projectRoot, routePath);
  const routeSource = await readOptional(routePath);
  let patchedRoute = false;

  if (!options.dryRun) {
    await mkdir(path.dirname(componentPath), { recursive: true });
    await writeFile(componentPath, entry.target_code, "utf8");
    await writeFile(loaderPath, entry.loader_code, "utf8");

    if (routeSource !== null) {
      const importPath = toRouteImportPath(routePath, loaderPath);
      const patched = patchNextRouteSource({
        source: routeSource,
        importPath,
        exportName: entry.loader_export,
      });
      if (patched.changed) {
        await writeFile(routePath, patched.source, "utf8");
        patchedRoute = true;
      }
    }

    await writeLockEntry(projectRoot, entry.template_id, {
      version: entry.version,
      checksum: entry.checksum,
      component_path: path.relative(projectRoot, componentPath),
      loader_path: path.relative(projectRoot, loaderPath),
    });
  }

  return {
    status: "updated",
    template_id: entry.template_id,
    from_version: lockEntry?.version ?? null,
    to_version: entry.version,
    component_path: componentPath,
    loader_path: loaderPath,
    patched_route: patchedRoute,
  };
}
