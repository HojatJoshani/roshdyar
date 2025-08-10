import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

/**
 * POST /api/orders/[id]/reorder
 * Validates that the order belongs to the user (or admin), and returns the
 * service + tier data needed to pre-fill the order flow for a quick repurchase.
 * This does NOT create a new order — it just resolves the tier to send the
 * user to /order with the right query params.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const order = await db.order.findFirst({
    where: {
      AND: [
        { id },
        { OR: [{ userId: session.user.id }, { user: { role: "ADMIN" } }] },
      ],
    },
    select: {
      id: true,
      code: true,
      serviceSlug: true,
      tier: true,
      quantity: true,
      targetLink: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Resolve the current tier for that service+slug (tier may have changed
  // since the original order — return the tier id if found, else null).
  const tier = await db.serviceTier.findFirst({
    where: {
      service: { slug: order.serviceSlug },
      tier: order.tier,
      isActive: true,
    },
    select: {
      id: true,
      minQuantity: true,
      maxQuantity: true,
    },
  });

  // If the tier was deactivated or no longer exists, fall back to any
  // active tier for that service.
  let fallbackTierId: string | null = tier?.id ?? null;
  let clampedQuantity = order.quantity;
  if (!tier) {
    const anyTier = await db.serviceTier.findFirst({
      where: { service: { slug: order.serviceSlug }, isActive: true },
      orderBy: { tier: "asc" },
      select: { id: true, minQuantity: true, maxQuantity: true },
    });
    fallbackTierId = anyTier?.id ?? null;
    if (anyTier) {
      clampedQuantity = Math.max(
        anyTier.minQuantity,
        Math.min(anyTier.maxQuantity, order.quantity)
      );
    }
  } else {
    clampedQuantity = Math.max(
      tier.minQuantity,
      Math.min(tier.maxQuantity, order.quantity)
    );
  }

  if (!fallbackTierId) {
    return NextResponse.json(
      { error: "SERVICE_UNAVAILABLE", message: "این سرویس دیگر در دسترس نیست." },
      { status: 410 }
    );
  }

  // Build the /order URL the client should navigate to
  const qs = new URLSearchParams({
    serviceTierId: fallbackTierId,
    quantity: String(clampedQuantity),
    link: order.targetLink,
    reorder: order.id,
  });

  return NextResponse.json({
    redirectUrl: `/order?${qs.toString()}`,
    serviceSlug: order.serviceSlug,
    tier: order.tier,
    quantity: clampedQuantity,
    originalQuantity: order.quantity,
    targetLink: order.targetLink,
    originalCode: order.code,
  });
}
