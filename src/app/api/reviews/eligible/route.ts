import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

/**
 * GET /api/reviews/eligible?serviceSlug=...
 * Returns the user's COMPLETED orders for the given service that haven't
 * been reviewed yet — so the UI can prompt "leave a review" with a picker.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = new URL(req.url);
  const serviceSlug = url.searchParams.get("serviceSlug");
  if (!serviceSlug) {
    return NextResponse.json({ error: "MISSING_SLUG" }, { status: 400 });
  }

  const orders = await db.order.findMany({
    where: {
      AND: [
        { userId: session.user.id },
        { serviceSlug },
        { status: "COMPLETED" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      code: true,
      serviceName: true,
      emoji: true,
      tier: true,
      quantity: true,
      createdAt: true,
    },
  });

  // Filter out orders that already have a review
  const reviewed = await db.serviceReview.findMany({
    where: { userId: session.user.id, service: { slug: serviceSlug } },
    select: { orderId: true },
  });
  const reviewedIds = new Set(reviewed.map((r) => r.orderId));

  // Has the user already reviewed this service at all? (one review per service)
  const existingReview = await db.serviceReview.findUnique({
    where: {
      serviceId_userId: {
        serviceId: (await db.service.findUnique({
          where: { slug: serviceSlug },
          select: { id: true },
        }))!.id,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });

  return NextResponse.json({
    eligibleOrders: orders
      .filter((o) => !reviewedIds.has(o.id))
      .map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
      })),
    alreadyReviewed: !!existingReview,
  });
}
