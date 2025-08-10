"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import { TierBadge } from "@/components/brand/tier-badge";
import { formatToman } from "@/lib/format";
import { TIER_META, type Tier } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface ComparisonTier {
  id: string;
  tier: string;
  displayName: string;
  tagline: string;
  features: string[];
  pricePer1000: number;
  minQuantity: number;
  maxQuantity: number;
  step: number;
  deliveryEstimate: string;
  refillPolicy: string;
  refundPolicy: string;
}

/**
 * Multi-tier side-by-side comparison table for the service detail page.
 * Lets users compare Economy / Standard / Premium at a glance before
 * choosing from the order config card.
 */
export function TierComparisonTable({ tiers }: { tiers: ComparisonTier[] }) {
  // Order: ECONOMY, STANDARD, PREMIUM
  const ordered = [...tiers].sort((a, b) => {
    const order: Record<string, number> = {
      ECONOMY: 0,
      STANDARD: 1,
      PREMIUM: 2,
    };
    return (order[a.tier] ?? 99) - (order[b.tier] ?? 99);
  });

  // Build feature matrix: for each tier, which features are "included"?
  // We use the tier's `features` array as a checklist. Since each tier has
  // its own feature list, we build a union of all features and mark per-tier.
  const allFeatures = new Set<string>();
  for (const t of ordered) {
    for (const f of t.features) allFeatures.add(f);
  }
  const featureList = Array.from(allFeatures);

  const hasRefill = (t: ComparisonTier) =>
    !t.refillPolicy.toLowerCase().includes("بدون") &&
    !t.refillPolicy.toLowerCase().includes("no ");

  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      {/* Scrollable container — horizontally scrollable on mobile */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header row — tier names */}
          <div className="grid grid-cols-4 border-b border-border/60 bg-muted/30">
            <div className="p-3 text-[11px] font-medium text-muted-foreground sm:p-4">
              مقایسه سطوح
            </div>
        {ordered.map((t) => {
          const meta = TIER_META[t.tier as Tier];
          return (
            <div
              key={t.id}
              className={cn(
                "relative p-3 text-center sm:p-4",
                meta.recommended && "bg-primary/[0.04]"
              )}
            >
              {meta.recommended && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-md bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                  پیشنهادی
                </span>
              )}
              <div className="mt-2 flex justify-center">
                <TierBadge tier={t.tier as Tier} size="sm" showDot={false} />
              </div>
              <p className="mt-2 line-clamp-1 text-[10px] text-muted-foreground sm:text-[11px]">
                {t.tagline}
              </p>
            </div>
          );
        })}
      </div>

      {/* Price row */}
      <Row label="قیمت هر ۱٬۰۰۰">
        {ordered.map((t) => (
          <Cell key={t.id} highlight={!!TIER_META[t.tier as Tier]?.recommended}>
            <span className="tnum text-sm font-bold tabular-nums text-foreground">
              {formatToman(t.pricePer1000)}
            </span>
            <span className="mr-1 text-[10px] text-muted-foreground">ت</span>
          </Cell>
        ))}
      </Row>

      {/* Delivery row */}
      <Row label="زمان تحویل">
        {ordered.map((t) => (
          <Cell key={t.id} highlight={!!TIER_META[t.tier as Tier]?.recommended}>
            <span className="text-xs text-foreground">{t.deliveryEstimate}</span>
          </Cell>
        ))}
      </Row>

      {/* Min/Max quantity row */}
      <Row label="محدوده تعداد">
        {ordered.map((t) => (
          <Cell key={t.id} highlight={!!TIER_META[t.tier as Tier]?.recommended}>
            <span className="tnum text-[11px] tabular-nums text-muted-foreground">
              {formatToman(t.minQuantity)} – {formatToman(t.maxQuantity)}
            </span>
          </Cell>
        ))}
      </Row>

      {/* Refill policy row */}
      <Row label="گارانتی ری‌فیل">
        {ordered.map((t) => (
          <Cell key={t.id} highlight={!!TIER_META[t.tier as Tier]?.recommended}>
            {hasRefill(t) ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" />
                {t.refillPolicy}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <X className="h-3 w-3" />
                ندارد
              </span>
            )}
          </Cell>
        ))}
      </Row>

      {/* Refund policy row */}
      <Row label="بازگشت وجه">
        {ordered.map((t) => (
          <Cell key={t.id} highlight={!!TIER_META[t.tier as Tier]?.recommended}>
            <span className="text-[10px] leading-4 text-muted-foreground">
              {t.refundPolicy}
            </span>
          </Cell>
        ))}
      </Row>

      {/* Features checklist */}
      <Row label="ویژگی‌ها">
        {ordered.map((t) => (
          <Cell key={t.id} highlight={!!TIER_META[t.tier as Tier]?.recommended}>
            <ul className="space-y-1.5">
              {featureList.map((f) => {
                const has = t.features.includes(f);
                return (
                  <li
                    key={f}
                    className="flex items-start gap-1.5 text-[10px] leading-4"
                  >
                    {has ? (
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    ) : (
                      <Minus className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/40" />
                    )}
                    <span
                      className={
                        has
                          ? "text-foreground"
                          : "text-muted-foreground/50 line-through"
                      }
                    >
                      {f}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Cell>
        ))}
      </Row>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-4 border-b border-border/40 last:border-b-0">
      <div className="flex items-center bg-muted/20 p-3 text-[11px] font-medium text-muted-foreground sm:p-4">
        {label}
      </div>
      {children}
    </div>
  );
}

function Cell({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center p-3 text-center sm:p-4",
        highlight && "bg-primary/[0.03]"
      )}
    >
      {children}
    </div>
  );
}
