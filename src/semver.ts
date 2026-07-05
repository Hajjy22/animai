export type ParsedVersion = { major: number; minor: number; patch: number };

export function parseVersion(raw: string): ParsedVersion | null {
  const match = /^\D*(\d+)\.(\d+)\.(\d+)/.exec(raw.trim());
  if (!match) {
    return null;
  }
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function compare(a: ParsedVersion, b: ParsedVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

/**
 * Checks whether an installed version satisfies a manifest peer_dep_ranges
 * entry. Supports the operators AnimAI manifests actually use (>=, >, <=, <,
 * =) plus ^ and ~ for forward compatibility with future ranges.
 */
export function satisfiesRange(installed: string, range: string): boolean | null {
  const installedVersion = parseVersion(installed);
  if (!installedVersion) {
    return null;
  }

  const match = /^(>=|<=|>|<|=|\^|~)?\s*(.+)$/.exec(range.trim());
  if (!match) {
    return null;
  }
  const [, operator = "=", versionText] = match;
  const target = parseVersion(versionText);
  if (!target) {
    return null;
  }

  switch (operator) {
    case ">=":
      return compare(installedVersion, target) >= 0;
    case ">":
      return compare(installedVersion, target) > 0;
    case "<=":
      return compare(installedVersion, target) <= 0;
    case "<":
      return compare(installedVersion, target) < 0;
    case "=":
      return compare(installedVersion, target) === 0;
    case "^": {
      const upperMajor = target.major > 0 ? target.major + 1 : 0;
      const upperMinor = target.major > 0 ? 0 : target.minor > 0 ? target.minor + 1 : 0;
      const upperPatch = target.major === 0 && target.minor === 0 ? target.patch + 1 : 0;
      const upper = { major: upperMajor, minor: upperMinor, patch: upperPatch };
      return compare(installedVersion, target) >= 0 && compare(installedVersion, upper) < 0;
    }
    case "~": {
      const upper = { major: target.major, minor: target.minor + 1, patch: 0 };
      return compare(installedVersion, target) >= 0 && compare(installedVersion, upper) < 0;
    }
    default:
      return null;
  }
}
