// License validation strategies.
//
//  - Polar (production): POST /v1/license-keys/validate with the org access
//    token and organization_id; a key is valid when the response is 200 and the
//    returned ValidatedLicenseKey has status "granted".
//  - Allowlist (local/dev/CI): validate against a comma-separated ANIMAI_TEST_KEYS
//    so the full gating flow can be exercised without a Polar account.
//
// Results are cached in KV for 24h so we never hammer Polar (their unauthenticated
// validate endpoint is rate-limited, and repeated CLI/agent calls are common).

const CACHE_TTL_SECONDS = 24 * 60 * 60;

/** @returns {{ validate(key: string): Promise<boolean> }} */
export function createValidator(env) {
  const base = env.POLAR_ORG_TOKEN
    ? polarValidator(env)
    : allowlistValidator(parseTestKeys(env.ANIMAI_TEST_KEYS));

  return env.LICENSE_CACHE ? cachedValidator(base, env.LICENSE_CACHE) : base;
}

function parseTestKeys(raw) {
  return (raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function allowlistValidator(keys) {
  const allowed = new Set(keys);
  return {
    async validate(key) {
      return allowed.has(key);
    },
  };
}

function polarValidator(env) {
  const baseUrl = (env.POLAR_BASE_URL || "https://api.polar.sh").replace(/\/+$/, "");
  return {
    async validate(key) {
      let response;
      try {
        response = await fetch(`${baseUrl}/v1/license-keys/validate`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${env.POLAR_ORG_TOKEN}`,
          },
          body: JSON.stringify({ key, organization_id: env.POLAR_ORG_ID }),
        });
      } catch {
        // Network error talking to Polar: fail closed (deny), do not cache.
        return false;
      }
      if (!response.ok) {
        return false;
      }
      const data = await response.json().catch(() => null);
      return Boolean(data && data.status === "granted");
    },
  };
}

function cachedValidator(base, kv) {
  return {
    async validate(key) {
      const cacheKey = `lic:${key}`;
      const cached = await kv.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        return cached === "1";
      }
      const ok = await base.validate(key);
      // Cache both positive and negative results, but negatives briefly so a
      // just-purchased license isn't locked out for a full day.
      await kv.put(cacheKey, ok ? "1" : "0", {
        expirationTtl: ok ? CACHE_TTL_SECONDS : 300,
      });
      return ok;
    },
  };
}
