import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/services
 * Returns the curated catalog. Provider details (providerKey,
 * providerServiceId, providerCostPer1000) are NEVER included.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const platform = url.searchParams.get("platform");
  const where: any = { isActive: true };
  if (platform) where.platform = platform.toUpperCase();

  const services = await db.service.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: [{ tier: "asc" }],
      },
    },
  });

  const out = services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    platform: s.platform,
    category: s.category,
    summary: s.summary,
    description: s.description,
    suitableFor: s.suitableFor,
    emoji: s.emoji,
    sortOrder: s.sortOrder,
    tiers: s.tiers.map((t) => ({
      id: t.id,
      tier: t.tier,
      displayName: t.displayName,
      tagline: t.tagline,
      features: t.featuresCsv.split(",").map((f) => f.trim()).filter(Boolean),
      pricePer1000: t.pricePer1000,
      minQuantity: t.minQuantity,
      maxQuantity: t.maxQuantity,
      step: t.step,
      deliveryEstimate: t.deliveryEstimate,
      refillPolicy: t.refillPolicy,
      refundPolicy: t.refundPolicy,
    })),
  }));

  return NextResponse.json({ services: out });
}
