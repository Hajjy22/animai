import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Lang, parse } from "@ast-grep/napi";
import type { Edit, SgNode } from "@ast-grep/napi";
import { writeLockEntry } from "./lockfile.js";
import { fetchMotionComponent } from "./registry.js";
import type { RegistrySource } from "./registry-client.js";

export type AddMotionComponentOptions = {
  cwd: string;
  templateId: string;
  componentsDir: string;
  routePath: string;
  dryRun: boolean;
  target?: string;
  /** When provided, the component is resolved through this source (remote +
   * fallback). When omitted, the bundled local registry is used. */
  source?: RegistrySource;
};

export type AddMotionComponentResult = {
  template_id: string;
  component_path: string;
  loader_path: string;
  route_path: string;
  dependency_command: string;
  wrote_component: boolean;
  wrote_loader: boolean;
  patched_route: boolean;
  route_patch_preview: string;
};

export async function addMotionComponent(
  options: AddMotionComponentOptions,
): Promise<AddMotionComponentResult> {
  const projectRoot = path.resolve(options.cwd);
  const template = options.source
    ? await options.source.fetch(options.templateId)
    : fetchMotionComponent(options.templateId);

  if (template.locked) {
    throw new Error(
      `"${options.templateId}" is a Pro component; its source is not bundled. Configure a licensed registry (ANIMAI_REGISTRY_URL) and license key.`,
    );
  }
  const componentPath = path.resolve(
    projectRoot,
    options.componentsDir,
    template.component_filename,
  );
  const loaderPath = path.resolve(
    projectRoot,
    options.componentsDir,
    template.loader_filename,
  );
  const routePath = path.resolve(projectRoot, options.routePath);

  assertInside(projectRoot, componentPath);
  assertInside(projectRoot, loaderPath);
  assertInside(projectRoot, routePath);

  const routeSource = await readFile(routePath, "utf8");
  const importPath = toRouteImportPath(routePath, loaderPath);
  const patchedRoute = patchNextRouteSource({
    source: routeSource,
    importPath,
    exportName: template.loader_export,
    target: options.target,
  });

  if (!options.dryRun) {
    await mkdir(path.dirname(componentPath), { recursive: true });
    await writeFile(componentPath, template.target_code, "utf8");
    await writeFile(loaderPath, template.loader_code, "utf8");

    if (patchedRoute.changed) {
      await writeFile(routePath, patchedRoute.source, "utf8");
    }

    await writeLockEntry(projectRoot, template.template_id, {
      version: template.version,
      checksum: template.checksum,
      component_path: path.relative(projectRoot, componentPath),
      loader_path: path.relative(projectRoot, loaderPath),
    });
  }

  return {
    template_id: template.template_id,
    component_path: componentPath,
    loader_path: loaderPath,
    route_path: routePath,
    dependency_command: `npm install ${template.dependencies.join(" ")}`,
    wrote_component: !options.dryRun,
    wrote_loader: !options.dryRun,
    patched_route: patchedRoute.changed && !options.dryRun,
    route_patch_preview: patchedRoute.source,
  };
}

export function patchNextRouteSource(input: {
  source: string;
  importPath: string;
  exportName: string;
  target?: string;
}): { source: string; changed: boolean } {
  const root = parse(Lang.Tsx, input.source).root();
  const edits: Edit[] = [];

  if (!hasImport(root, input.exportName, input.importPath)) {
    edits.push(createImportEdit(root, input.exportName, input.importPath));
  }

  if (!hasJsxUsage(root, input.exportName)) {
    edits.push(createInsertionEdit(root, input.exportName, input.target));
  }

  if (edits.length === 0) {
    return {
      source: input.source,
      changed: false,
    };
  }

  return {
    source: root.commitEdits(edits),
    changed: true,
  };
}

function hasImport(root: SgNode, exportName: string, importPath: string): boolean {
  return root.children().some((child) => {
    if (child.kind() !== "import_statement") {
      return false;
    }

    const text = child.text();
    return text.includes(exportName) && text.includes(importPath);
  });
}

function hasJsxUsage(root: SgNode, exportName: string): boolean {
  return Boolean(root.find(`<${exportName} />`) ?? root.find(`<${exportName}></${exportName}>`));
}

function createImportEdit(root: SgNode, exportName: string, importPath: string): Edit {
  const importNodes = root.children().filter((child) => child.kind() === "import_statement");
  const importText = `import { ${exportName} } from "${importPath}";`;

  if (importNodes.length === 0) {
    return {
      startPos: 0,
      endPos: 0,
      insertedText: `${importText}\n\n`,
    };
  }

  const lastImport = importNodes[importNodes.length - 1];
  const insertAt = lastImport.range().end.index;

  return {
    startPos: insertAt,
    endPos: insertAt,
    insertedText: `\n${importText}`,
  };
}

function createInsertionEdit(
  root: SgNode,
  exportName: string,
  target?: string,
): Edit {
  const container = findInsertionContainer(root, target);

  const openingElement = container
    .children()
    .find((child) => child.kind() === "jsx_opening_element");

  if (!openingElement) {
    throw new Error(
      "Could not find an opening JSX element to inject the motion component into.",
    );
  }

  const indentation = " ".repeat(openingElement.range().start.column + 2);
  const insertAt = openingElement.range().end.index;

  return {
    startPos: insertAt,
    endPos: insertAt,
    insertedText: `\n${indentation}<${exportName} />`,
  };
}

/**
 * Resolves the JSX element the loader should be injected into. When `target`
 * is given, that tag is required. Otherwise we prefer a `<main>` wrapper and
 * fall back to the outermost paired JSX element the route returns, so routes
 * without a `<main>` still work.
 */
function findInsertionContainer(root: SgNode, target?: string): SgNode {
  if (target) {
    const explicit = root.find(`<${target} $$$ATTRS>$$$CHILDREN</${target}>`);
    if (!explicit) {
      throw new Error(
        `Could not find a <${target}> element in the route. Pass --target with a wrapper element that exists, or omit it to auto-detect.`,
      );
    }
    return explicit;
  }

  const mainNode = root.find("<main $$$ATTRS>$$$CHILDREN</main>");
  if (mainNode) {
    return mainNode;
  }

  const outermostJsx = root.find({ rule: { kind: "jsx_element" } });
  if (outermostJsx) {
    return outermostJsx;
  }

  throw new Error(
    "Could not find a JSX element to inject into. Ensure the route returns JSX with a container element, or pass --target.",
  );
}

export function toRouteImportPath(routePath: string, loaderPath: string): string {
  const routeDir = path.dirname(routePath);
  const parsed = path.parse(loaderPath);
  const withoutExtension = path.join(parsed.dir, parsed.name);
  let relativePath = path.relative(routeDir, withoutExtension).split(path.sep).join("/");

  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
}

export function assertInside(root: string, target: string): void {
  const relativePath = path.relative(root, target);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Refusing to write outside the project root: ${target}`);
  }
}
