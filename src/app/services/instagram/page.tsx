import { SiteShell } from "@/components/brand/site-shell";
import { ServiceBreadcrumb } from "@/components/brand/service-breadcrumb";
import { ServiceCatalog } from "@/components/brand/service-catalog";
import { db } from "@/lib/db";
import { toFaDigits, formatToman } from "@/lib/format";
import { Instagram, Sparkles, ShieldCheck, Zap, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

async function getInstagramServices() {
  const services = await db.service.findMany({
    where: { isActive: true, platform: "INSTAGRAM" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: [{ tier: "asc" }],
      },
    },
  });

  // Honest completed-order counts per service slug
  const orderCounts = await db.order.groupBy({
    by: ["serviceSlug"],
    where: {
      serviceSlug: { in: services.map((s) => s.slug) },
      status: "COMPLETED",
    },
    _count: { _all: true },
  });
  const countMap = new Map(
    orderCounts.map((o) => [o.serviceSlug, o._count._all])
  );

  // Strip provider-only fields. Only customer-facing fields exposed.
  return services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    platform: s.platform,
    category: s.category,
    summary: s.summary,
    emoji: s.emoji,
    completedOrderCount: countMap.get(s.slug) ?? 0,
    tiers: s.tiers.map((t) => ({
      id: t.id,
      tier: t.tier,
      displayName: t.displayName,
      tagline: t.tagline,
      pricePer1000: t.pricePer1000,
      deliveryEstimate: t.deliveryEstimate,
    })),
  }));
}

export default async function InstagramServicesPage() {
  const services = await getInstagramServices();
  const cheapest = services.reduce<number | null>((acc, s) => {
    const min = Math.min(...s.tiers.map((t) => t.pricePer1000));
    return acc === null || min < acc ? min : acc;
  }, null);

  return (
    <SiteShell>
      {/* Hero strip */}
      <section className="relative overflow-hidden border-b border-border/60 bg-mesh-brand">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="container relative mx-auto px-4 py-8 sm:py-12">
          <ServiceBreadcrumb
            items={[
              { label: "خانه", href: "/" },
              { label: "خدمات", href: "/services/instagram" },
              { label: "اینستاگرام" },
            ]}
            className="mb-5"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
              <Instagram className="h-3.5 w-3.5" style={{ color: "#E1306C" }} />
              اینستاگرام
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              {toFaDigits(services.length)} سرویس فعال
            </span>
            {cheapest !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
                شروع از{" "}
                <span className="tnum font-semibold tabular-nums text-foreground">
                  {formatToman(cheapest)}
                </span>
                <span>ت / ۱٬۰۰۰</span>
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            خدمات رشد اینستاگرام
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-7 text-muted-foreground sm:text-base">
            فالوور، لایک و بازدید با کیفیت واقعی، تحویل شفاف و گارانتی ری‌فیل.
            هر سرویس سه سطح کیفی دارد — اقتصادی، استاندارد و حرفه‌ای. انتخاب با
            شماست.
          </p>

          {/* Trust chips */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              پرداخت امن از کیف پول
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              تحویل شفاف و رهگیری‌پذیر
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              گارانتی ری‌فیل در سطوح بالاتر
            </span>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="container mx-auto px-4 py-10 md:py-14">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 py-20 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Instagram className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              سرویسی یافت نشد
            </h3>
            <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
              در حال حاضر سرویس فعال اینستاگرام در دسترس نیست. بعداً دوباره تلاش
              کنید.
            </p>
          </div>
        ) : (
          <ServiceCatalog services={services} />
        )}
      </section>
    </SiteShell>
  );
}
