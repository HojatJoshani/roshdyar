import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

const Query = z.object({
  q: z.string().trim().min(1).max(100),
});

/**
 * GET /api/search?q=...
 * Global search across services (public) + the user's orders + tickets
 * (auth-required). Returns grouped results. Provider-only fields never exposed.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  let q: string;
  try {
    q = Query.parse({ q: url.searchParams.get("q") ?? "" }).q;
  } catch {
    return NextResponse.json({ error: "INVALID_QUERY" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const term = q.trim();
  const lower = term.toLowerCase();

  // Always search services (public catalog)
  const services = await db.service.findMany({
    where: {
      AND: [
        { isActive: true },
        {
          OR: [
            { name: { contains: term } },
            { summary: { contains: term } },
            { category: { contains: term } },
            { platform: { contains: term.toUpperCase() } },
          ],
        },
      ],
    },
    take: 6,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: [{ tier: "asc" }],
        take: 1,
      },
    },
  });

  const serviceResults = services.map((s) => ({
    type: "service" as const,
    id: s.id,
    slug: s.slug,
    name: s.name,
    emoji: s.emoji,
    platform: s.platform,
    summary: s.summary,
    priceFrom: s.tiers.length > 0
      ? Math.min(...s.tiers.map((t) => t.pricePer1000))
      : null,
  }));

  let orderResults: {
    type: "order";
    id: string;
    code: string;
    serviceName: string;
    emoji: string;
    status: string;
    totalAmount: number;
  }[] = [];
  let ticketResults: {
    type: "ticket";
    id: string;
    code: string;
    subject: string;
    status: string;
  }[] = [];

  if (session?.user?.id) {
    // Search user's orders by code or service name
    const [orders, tickets] = await Promise.all([
      db.order.findMany({
        where: {
          AND: [
            { userId: session.user.id },
            {
              OR: [
                { code: { contains: term.toUpperCase() } },
                { serviceName: { contains: term } },
                { targetLink: { contains: term } },
              ],
            },
          ],
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          code: true,
          serviceName: true,
          emoji: true,
          status: true,
          totalAmount: true,
        },
      }),
      db.supportTicket.findMany({
        where: {
          AND: [
            { userId: session.user.id },
            {
              OR: [
                { code: { contains: term.toUpperCase() } },
                { subject: { contains: term } },
              ],
            },
          ],
        },
        take: 3,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          code: true,
          subject: true,
          status: true,
        },
      }),
    ]);

    orderResults = orders.map((o) => ({
      type: "order" as const,
      id: o.id,
      code: o.code,
      serviceName: o.serviceName,
      emoji: o.emoji,
      status: o.status,
      totalAmount: o.totalAmount,
    }));

    ticketResults = tickets.map((t) => ({
      type: "ticket" as const,
      id: t.id,
      code: t.code,
      subject: t.subject,
      status: t.status,
    }));
  }

  return NextResponse.json({
    services: serviceResults,
    orders: orderResults,
    tickets: ticketResults,
    total:
      serviceResults.length +
      orderResults.length +
      ticketResults.length,
  });
}
