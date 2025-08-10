import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/reviews/featured
 * Public — returns up to 6 recent high-rated (>=4 stars) reviews across
 * all services, with the service slug + name joined so the UI can link to
 * the service detail page. Used on the home page for honest social proof.
 */
export async function GET() {
  const reviews = await db.serviceReview.findMany({
    where: {
      isHidden: false,
      rating: { gte: 4 },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      service: {
        select: { id: true, slug: true, name: true, emoji: true },
      },
      user: {
        select: { name: true, email: true },
      },
    },
  });

  // Deduplicate: at most 2 reviews per service slug (so the carousel
  // shows variety rather than 6 reviews of the same service).
  const byService = new Map<string, number>();
  const filtered = [];
  for (const r of reviews) {
    const c = byService.get(r.service.slug) ?? 0;
    if (c < 2) {
      filtered.push(r);
      byService.set(r.service.slug, c + 1);
    }
    if (filtered.length >= 6) break;
  }

  return NextResponse.json({
    reviews: filtered.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      userDisplayName: maskName(r.user.name ?? r.user.email),
      service: {
        slug: r.service.slug,
        name: r.service.name,
        emoji: r.service.emoji,
      },
    })),
  });
}

function maskName(input: string): string {
  if (!input) return "کاربر رشدیار";
  if (input.includes("@")) {
    const [name, domain] = input.split("@");
    if (name.length <= 2) return `*@${domain}`;
    return `${name[0]}${"‌".repeat(3)}@${domain}`;
  }
  if (input.length <= 2) return input[0] + "*";
  return `${input[0]}${"‌".repeat(3)}${input[input.length - 1]}`;
}
