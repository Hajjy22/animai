export function TierBadge({ tier }: { tier: "free" | "pro" }) {
  if (tier === "pro") {
    return (
      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-400/30">
        Pro
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30">
      Free
    </span>
  );
}
