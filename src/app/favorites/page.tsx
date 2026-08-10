import { SiteShell } from "@/components/brand/site-shell";
import { ServiceCard } from "@/components/brand/service-card";
import { FavoritesView } from "./favorites-view";
import { db } from "@/lib/db";
import { Heart } from "lucide-react";
import { Tier } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getAllServices() {
  const services = await db.service.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: [{ tier: "asc" }],
      },
    },
  });
  return services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    platform: s.platform,
    category: s.category,
    summary: s.summary,
    emoji: s.emoji,
    tiers: s.tiers.map((t) => ({
      id: t.id,
      tier: t.tier as Tier,
      displayName: t.displayName,
      tagline: t.tagline,
      pricePer1000: t.pricePer1000,
      deliveryEstimate: t.deliveryEstimate,
    })),
  }));
}

export default async function FavoritesPage() {
  const allServices = await getAllServices();

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-mesh-brand">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <Heart className="h-5 w-5 fill-current" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                علاقه‌مندی‌های من
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                سرویس‌هایی که برای بعد ذخیره کرده‌اید.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        <FavoritesView allServices={allServices} />
      </section>
    </SiteShell>
  );
}
