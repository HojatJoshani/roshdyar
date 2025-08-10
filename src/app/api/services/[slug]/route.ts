import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const s = await db.service.findUnique({
    where: { slug },
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: [{ tier: "asc" }],
      },
    },
  });
  if (!s || !s.isActive) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const out = {
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
  };
  return NextResponse.json({ service: out });
}
