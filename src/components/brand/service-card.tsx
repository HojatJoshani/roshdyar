import Link from "next/link";
import { Card } from "@/components/ui/card";
import { TierBadge } from "@/components/brand/tier-badge";
import { FavoriteButton } from "@/components/brand/favorite-button";
import { ArrowLeft, Clock } from "lucide-react";
import { formatToman, formatQuantity } from "@/lib/format";
import { Tier } from "@/lib/constants";
import { PLATFORM_META, CATEGORY_META } from "@/lib/constants";

export interface ServiceCardData {
  id: string;
  slug: string;
  name: string;
  platform: string;
  category: string;
  summary?: string;
  emoji: string;
  tiers: {
    id: string;
    tier: string;
    displayName: string;
    tagline: string;
    pricePer1000: number;
    deliveryEstimate: string;
  }[];
  /** Honest count of completed orders — shown only when > 0. Optional. */
  completedOrderCount?: number;
}

export function ServiceCard({ service }: { service: ServiceCardData }) {
  const standard = service.tiers.find((t) => t.tier === "STANDARD") ?? service.tiers[0];
  const cheapest = [...service.tiers].sort((a, b) => a.pricePer1000 - b.pricePer1000)[0];
  const platformMeta = PLATFORM_META[service.platform as keyof typeof PLATFORM_META];
  const categoryMeta = CATEGORY_META[service.category as keyof typeof CATEGORY_META];

  return (
    <Link href={`/services/${service.slug}`} className="group block h-full">
      <Card className="relative flex h-full flex-col overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft hover:border-primary/40">
        {/* Top row: emoji + platform tag + favorite */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-2xl">
            {service.emoji}
          </div>
          <div className="flex items-center gap-1.5">
            <FavoriteButton slug={service.slug} name={service.name} size="sm" />
            <span
              className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-medium"
              style={{
                color: platformMeta?.color,
                borderColor: `${platformMeta?.color}30`,
                backgroundColor: `${platformMeta?.color}0d`,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: platformMeta?.color }} />
              {platformMeta?.label}
            </span>
          </div>
        </div>

        <h3 className="text-base font-semibold text-foreground">{service.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {service.summary}
        </p>

        {/* Tier quick chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {service.tiers.map((t) => (
            <TierBadge key={t.id} tier={t.tier as Tier} size="sm" />
          ))}
        </div>

        {/* Honest order count — only when > 0 */}
        {service.completedOrderCount && service.completedOrderCount > 0 && (
          <div className="mt-3 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="tnum tabular-nums">
              {formatQuantity(service.completedOrderCount)}
            </span>{" "}
            سفارش موفق
          </div>
        )}

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between border-t border-border/60 pt-4">
            <div>
              <div className="text-[11px] text-muted-foreground">شروع از</div>
              <div className="flex items-baseline gap-1">
                <span className="tnum text-lg font-bold tabular-nums text-foreground">
                  {formatToman(cheapest.pricePer1000)}
                </span>
                <span className="text-xs text-muted-foreground">ت/۱۰۰۰</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {standard?.deliveryEstimate}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                مشاهده
                <ArrowLeft className="h-3 w-3 rtl-flip" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
