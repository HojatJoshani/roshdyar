import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { OrderStatus } from "@/lib/constants";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  // Strip provider-only fields
  const out = orders.map((o) => ({
    id: o.id,
    code: o.code,
    userId: o.userId,
    userEmail: o.user?.email ?? null,
    userName: o.user?.name ?? null,
    serviceName: o.serviceName,
    serviceSlug: o.serviceSlug,
    platform: o.platform,
    category: o.category,
    tier: o.tier as string,
    tierDisplay: o.tierDisplay,
    emoji: o.emoji,
    quantity: o.quantity,
    unitPricePer1000: o.unitPricePer1000,
    totalAmount: o.totalAmount,
    targetLink: o.targetLink,
    notes: o.notes,
    status: o.status as OrderStatus,
    startedCount: o.startedCount,
    remainsCount: o.remainsCount,
    completedCount: o.completedCount,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }));

  return NextResponse.json({ orders: out });
}
