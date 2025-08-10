import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { AdminShell } from "../admin-shell";
import { PromosManager } from "./promos-manager";

export const dynamic = "force-dynamic";

async function getPromos() {
  const promos = await db.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { redemptions: true } },
      redemptions: {
        where: { createdAt: { gte: new Date(Date.now() - 14 * 86400 * 1000) } },
        select: { createdAt: true },
      },
    },
  });

  // Build 14-day sparkline
  const dayKeys: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  return promos.map((p) => {
    const bucket = new Map<string, number>();
    for (const k of dayKeys) bucket.set(k, 0);
    for (const r of p.redemptions) {
      const key = r.createdAt.toISOString().slice(0, 10);
      if (bucket.has(key)) bucket.set(key, (bucket.get(key) ?? 0) + 1);
    }
    return {
      id: p.id,
      code: p.code,
      description: p.description,
      type: p.type,
      value: p.value,
      appliesTo: p.appliesTo,
      maxUses: p.maxUses,
      usedCount: p.usedCount,
      redemptionCount: p._count.redemptions,
      perUserLimit: p.perUserLimit,
      minOrderAmount: p.minOrderAmount,
      expiresAt: p.expiresAt?.toISOString() ?? null,
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
      sparkline: dayKeys.map((k) => ({
        date: new Intl.DateTimeFormat("fa-IR", {
          month: "numeric",
          day: "numeric",
        }).format(new Date(k + "T00:00:00")),
        count: bucket.get(k) ?? 0,
      })),
    };
  });
}

export default async function AdminPromosPage() {
  await requireAdmin();
  const promos = await getPromos();
  return (
    <AdminShell>
      <PromosManager initialPromos={promos} />
    </AdminShell>
  );
}
