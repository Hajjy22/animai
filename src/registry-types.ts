export type ComponentTier = "free" | "pro";

/**
 * Which shelf a component sits on. `showcase` = the marketing/landing flair
 * (heroes, backgrounds, 3D). The rest are the everyday app-UI categories. Used
 * for site filtering and the optional MCP search filter. Optional for backward
 * compatibility with manifests authored before the field existed.
 */
export type ComponentCategory =
  | "showcase"
  | "forms"
  | "overlays"
  | "navigation"
  | "feedback"
  | "recipe"
  | "design-system";

export type DisposeAudit = "pass" | "fail" | "pending";

/**
 * How the report was produced. `static` = AST-only checks (no browser).
 * `runtime` = browser mount/unmount + renderer.info measurement.
 * `static+runtime` = both tiers ran.
 */
export type VettingMethod = "static" | "runtime" | "static+runtime";

/** Accessibility verdict for interactive UI components; "n/a" for showcase pieces. */
export type A11yVerdict = "pass" | "fail" | "n/a";

export type VettingReport = {
  dispose_audit: DisposeAudit;
  ssr_safe: boolean;
  vram_leak: boolean;
  a11y?: A11yVerdict;
  fps_budget: number;
  measured_fps: number | null;
  method: VettingMethod;
  verified_at: string | null;
  harness_version: string | null;
};

/**
 * Metadata authored by hand in each `registry/<id>/manifest.json`.
 * Contains no source code — the code lives in the sibling `.tsx` files
 * and is inlined by `scripts/build-registry.mjs`.
 */
export type ComponentManifest = {
  template_id: string;
  version: string;
  tier: ComponentTier;
  category?: ComponentCategory;
  title: string;
  summary: string;
  framework: string;
  framework_targets: string[];
  component_filename: string;
  loader_filename: string;
  loader_export: string;
  dependencies: string[];
  peer_dep_ranges: Record<string, string>;
  integration_instructions: string[];
  preview_url: string;
  vetting_report: VettingReport;
  tags: string[];
};

/**
 * A fully compiled registry entry: the manifest plus the inlined component
 * and loader source, plus a content checksum. This is what the generated
 * `registry.data.ts` holds and what `fetchMotionComponent` returns.
 */
export type RegistryEntry = ComponentManifest & {
  target_code: string;
  loader_code: string;
  checksum: string;
  /**
   * Set on Pro components in the bundled/static data: the metadata is present
   * but the source has been withheld. The real payload comes from the licensed
   * Worker. Consumers must treat a locked entry as "requires upgrade".
   */
  locked?: boolean;
};

/**
 * Backward-compatible alias. The historical `MotionComponentPayload` is now a
 * superset (extra fields such as `version`, `tier`, `checksum`); every field the
 * CLI and MCP layer previously read is still present with the same name.
 */
export type MotionComponentPayload = RegistryEntry;

export type MotionSearchResult = {
  template_id: string;
  title: string;
  summary: string;
  framework: string;
  tier: ComponentTier;
  category?: ComponentCategory;
  tags: string[];
  add_command: string;
};
