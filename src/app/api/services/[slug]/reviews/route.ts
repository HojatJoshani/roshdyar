import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

/**
 * GET /api/services/[slug]/reviews
 * Public — returns approved (non-hidden) reviews for a service, plus
 * aggregate rating stats (average + count per star).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const service = await db.service.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!service) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const reviews = await db.serviceReview.findMany({
    where: { serviceId: service.id, isHidden: false },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  const count = reviews.length;
  const avg = count > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / count
    : 0;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) distribution[r.rating]++;

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      userDisplayName: maskName(r.user.name ?? r.user.email),
    })),
    stats: {
      count,
      average: Math.round(avg * 10) / 10,
      distribution,
    },
  });
}

const CreateBody = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().or(z.literal("")),
});

/**
 * POST /api/services/[slug]/reviews
 * Auth required. Validates that the user owns the order, the order is for
 * this service, the order is COMPLETED, and the user hasn't already reviewed
 * this service. Creates the review (locked to orderId, unique per user+service).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  let body: z.infer<typeof CreateBody>;
  try {
    body = CreateBody.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: e?.errors ?? e?.message },
      { status: 400 }
    );
  }

  const service = await db.service.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!service) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Validate order ownership + completion + service match
  const order = await db.order.findFirst({
    where: {
      AND: [
        { id: body.orderId },
        { userId: session.user.id },
        { serviceSlug: slug },
        { status: "COMPLETED" },
      ],
    },
    select: { id: true },
  });
  if (!order) {
    return NextResponse.json(
      {
        error: "NOT_ELIGIBLE",
        message:
          "برای ثبت نظر، باید سفارش تکمیل‌شده برای این سرویس داشته باشید.",
      },
      { status: 403 }
    );
  }

  // Check existing review (unique per user+service)
  const existing = await db.serviceReview.findUnique({
    where: {
      serviceId_userId: { serviceId: service.id, userId: session.user.id },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "ALREADY_REVIEWED", message: "شما قبلاً برای این سرویس نظر ثبت کرده‌اید." },
      { status: 409 }
    );
  }

  const review = await db.serviceReview.create({
    data: {
      serviceId: service.id,
      userId: session.user.id,
      orderId: body.orderId,
      rating: body.rating,
      comment: body.comment || null,
    },
  });

  return NextResponse.json({ ok: true, review });
}

/** Mask email/name for privacy: "user@x.com" → "u***@x.com" */
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
