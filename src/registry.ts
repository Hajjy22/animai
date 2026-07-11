import { REGISTRY_DATA } from "./registry.data.js";
import type {
  ComponentTier,
  MotionComponentPayload,
  MotionSearchResult,
  RegistryEntry,
} from "./registry-types.js";

export type {
  ComponentManifest,
  ComponentTier,
  MotionComponentPayload,
  MotionSearchResult,
  RegistryEntry,
  VettingReport,
} from "./registry-types.js";

export const DEFAULT_TEMPLATE_ID = "hero-orbital-rig";

const REGISTRY_BY_ID: Record<string, RegistryEntry> = Object.fromEntries(
  REGISTRY_DATA.map((entry) => [entry.template_id, entry]),
);

/**
 * Backward-compatible export. Historically a flat record of payloads; now
 * derived from the file-based registry so existing importers keep working.
 */
export const STATIC_TEMPLATE_CACHE: Record<string, MotionComponentPayload> =
  REGISTRY_BY_ID;

export function getComponent(templateId: string): RegistryEntry | undefined {
  return REGISTRY_BY_ID[templateId];
}

export function fetchMotionComponent(
  templateId = DEFAULT_TEMPLATE_ID,
): MotionComponentPayload {
  return REGISTRY_BY_ID[templateId] ?? REGISTRY_BY_ID[DEFAULT_TEMPLATE_ID];
}

export function listMotionComponents(): MotionSearchResult[] {
  return REGISTRY_DATA.map(toSearchResult);
}

export function searchMotionLibrary(
  query: string,
  limit = 5,
): MotionSearchResult[] {
  return rankSearchResults(listMotionComponents(), query, limit);
}

/**
 * Tokenized relevance ranking over a set of search results. Shared by the
 * local registry and the remote client so both score queries identically.
 */
export function rankSearchResults(
  results: MotionSearchResult[],
  query: string,
  limit: number,
): MotionSearchResult[] {
  const queryTokens = tokenize(query);
  return results
    .map((result) => {
      const searchableSet = new Set(
        tokenize(
          [
            result.template_id,
            result.title,
            result.summary,
            result.framework,
            ...result.tags,
          ].join(" "),
        ),
      );
      const score = queryTokens.reduce(
        (total, token) => total + (searchableSet.has(token) ? 1 : 0),
        0,
      );
      return { score, result };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.result.template_id.localeCompare(right.result.template_id);
    })
    .slice(0, limit)
    .map((item) => item.result);
}

function toSearchResult(entry: RegistryEntry): MotionSearchResult {
  return {
    template_id: entry.template_id,
    title: entry.title,
    summary: entry.summary,
    framework: entry.framework,
    tier: entry.tier as ComponentTier,
    category: entry.category,
    tags: [...entry.tags],
    add_command: `npx animai add ${entry.template_id}`,
  };
}

function tokenize(value: string): string[] {
  let normalized = "";

  for (const character of value.toLowerCase()) {
    const code = character.charCodeAt(0);
    const isNumber = code >= 48 && code <= 57;
    const isLetter = code >= 97 && code <= 122;
    normalized += isNumber || isLetter ? character : " ";
  }

  return normalized
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
}
