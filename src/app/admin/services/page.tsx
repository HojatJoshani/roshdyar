import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_META, CATEGORY_META, Tier } from "@/lib/constants";
import { formatToman, toFaDigits } from "@/lib/format";
import { TierEditDialog, TierRow } from "./tier-edit-dialog";
import { Package, CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

async function getServices() {
  const services = await db.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      tiers: {
        orderBy: [{ tier: "asc" }],
      },
    },
  });
  // Strip provider-only fields from each tier
  return services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    platform: s.platform,
    category: s.category,
    summary: s.summary,
    emoji: s.emoji,
    isActive: s.isActive,
    tiers: s.tiers.map((t) => ({
      id: t.id,
      tier: t.tier as Tier,
      displayName: t.displayName,
      tagline: t.tagline,
      featuresCsv: t.featuresCsv,
      pricePer1000: t.pricePer1000,
      minQuantity: t.minQuantity,
      maxQuantity: t.maxQuantity,
      step: t.step,
      deliveryEstimate: t.deliveryEstimate,
      refillPolicy: t.refillPolicy,
      refundPolicy: t.refundPolicy,
      isActive: t.isActive,
    })),
  }));
}

export default async function AdminServicesPage() {
  const services = await getServices();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">خدمات</h1>
        <p className="text-sm text-muted-foreground">
          مدیریت سرویس‌ها و قیمت‌گذاری سطح‌ها. سفارش‌های قبلی تحت تأثیر قرار نمی‌گیرند.
        </p>
      </div>

      {services.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center text-muted-foreground">
            <Package className="mx-auto mb-3 h-10 w-10 opacity-40" />
            هنوز خدماتی تعریف نشده است.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {services.map((svc) => {
            const platform = PLATFORM_META[svc.platform as keyof typeof PLATFORM_META];
            const category = CATEGORY_META[svc.category as keyof typeof CATEGORY_META];
            return (
              <Card key={svc.id} className="py-0">
                <CardHeader className="flex-row items-start justify-between gap-3 border-b border-border/60 py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-2xl">
                      {svc.emoji}
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        <span>{svc.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {platform?.label ?? svc.platform}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {category?.label ?? svc.category}
                        </Badge>
                        {!svc.isActive && (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <XCircle className="h-3 w-3" />
                            غیرفعال
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        {svc.summary}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="hidden text-left sm:block">
                    <div className="text-[11px] text-muted-foreground">تعداد سطح‌ها</div>
                    <div className="text-lg font-bold tnum">
                      {toFaDigits(svc.tiers.length)}
                    </div>
                  </div>
                </CardHeader>

                {/* Tiers list */}
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-y-0 sm:divide-x sm:divide-x-reverse">
                    {svc.tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="flex flex-col justify-between gap-4 p-4 sm:p-5"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{tier.displayName}</span>
                            {tier.isActive ? (
                              <Badge
                                variant="outline"
                                className="gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                فعال
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="gap-1 text-[10px] text-muted-foreground"
                              >
                                <XCircle className="h-3 w-3" />
                                غیرفعال
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {tier.tagline}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-muted/40 p-2">
                              <div className="text-[10px] text-muted-foreground">قیمت هر ۱٬۰۰۰</div>
                              <div className="font-bold tnum tabular-nums">
                                {formatToman(tier.pricePer1000)}
                              </div>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-2">
                              <div className="text-[10px] text-muted-foreground">زمان تحویل</div>
                              <div className="font-medium">{tier.deliveryEstimate}</div>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-2">
                              <div className="text-[10px] text-muted-foreground">حداقل</div>
                              <div className="font-medium tnum tabular-nums">
                                {toFaDigits(tier.minQuantity.toLocaleString("en-US"))}
                              </div>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-2">
                              <div className="text-[10px] text-muted-foreground">حداکثر</div>
                              <div className="font-medium tnum tabular-nums">
                                {toFaDigits(tier.maxQuantity.toLocaleString("en-US"))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <TierEditDialog tier={tier as TierRow} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
