import { cn } from "@/lib/utils";
import { Tier, TIER_META } from "@/lib/constants";

const tierClasses: Record<Tier, string> = {
  ECONOMY:
    "bg-tier-economy text-tier-economy-foreground border-transparent",
  STANDARD:
    "bg-tier-standard text-tier-standard-foreground border-transparent",
  PREMIUM:
    "bg-tier-premium text-tier-premium-foreground border-transparent",
};

const tierDotClasses: Record<Tier, string> = {
  ECONOMY: "bg-tier-economy-foreground/40",
  STANDARD: "bg-white/60",
  PREMIUM: "bg-tier-premium-foreground/50",
};

export function TierBadge({
  tier,
  size = "md",
  showDot = true,
  className,
}: {
  tier: Tier;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
}) {
  const meta = TIER_META[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium tabular-nums",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        tierClasses[tier]
      )}
      style={{ letterSpacing: 0 }}
    >
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tierDotClasses[tier]
          )}
        />
      )}
      {meta.label}
      {meta.recommended && (
        <span className="mx-0.5 opacity-80">★</span>
      )}
    </span>
  );
}
