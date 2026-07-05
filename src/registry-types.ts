export type ComponentTier = "free" | "pro";

export type DisposeAudit = "pass" | "fail" | "pending";

/**
 * How the report was produced. `static` = AST-only checks (no browser).
 * `runtime` = browser mount/unmount + renderer.info measurement.
 * `static+runtime` = both tiers ran.
 */
export type VettingMethod = "static" | "runtime" | "static+runtime";

export type VettingReport = {
  dispose_audit: DisposeAudit;
  ssr_safe: boolean;
  vram_leak: boolean;
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
  tags: string[];
  add_command: string;
};
