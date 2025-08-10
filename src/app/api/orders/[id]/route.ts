import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const order = await db.order.findFirst({
    where: {
      AND: [{ id }, { OR: [{ userId: session.user.id }, { user: { role: "ADMIN" } }] }],
    },
    include: {
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      code: order.code,
      userId: order.userId,
      serviceName: order.serviceName,
      serviceSlug: order.serviceSlug,
      platform: order.platform,
      category: order.category,
      tier: order.tier,
      tierDisplay: order.tierDisplay,
      emoji: order.emoji,
      quantity: order.quantity,
      unitPricePer1000: order.unitPricePer1000,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      promoCode: order.promoCode,
      targetLink: order.targetLink,
      notes: order.notes,
      status: order.status,
      startedCount: order.startedCount,
      remainsCount: order.remainsCount,
      completedCount: order.completedCount,
      acceptedTerms: order.acceptedTerms,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      events: order.events.map((e) => ({
        id: e.id,
        status: e.status,
        message: e.message,
        createdAt: e.createdAt,
      })),
    },
  });
}
