import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

/**
 * GET /api/admin/reviews
 * Admin-only — returns all reviews (including hidden ones) with the
 * service + user joined, for moderation.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const reviews = await db.serviceReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      service: {
        select: { id: true, slug: true, name: true, emoji: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      isHidden: r.isHidden,
      createdAt: r.createdAt,
      service: {
        slug: r.service.slug,
        name: r.service.name,
        emoji: r.service.emoji,
      },
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
      },
    })),
  });
}
