import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

/**
 * GET /api/notifications
 * Returns order-event-based notifications for the current user.
 * A "notification" = an OrderEvent on any of the user's orders, surfaced
 * with the order context (code, emoji, etc). Unread = events newer than
 * user.lastSeenNotificationsAt.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { lastSeenNotificationsAt: true },
  });
  const since = user?.lastSeenNotificationsAt ?? new Date(0);

  // Pull the last 30 events across the user's orders
  const events = await db.orderEvent.findMany({
    where: { order: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      order: {
        select: {
          id: true,
          code: true,
          emoji: true,
          serviceName: true,
          status: true,
        },
      },
    },
  });

  const out = events.map((e) => ({
    id: e.id,
    orderId: e.order.id,
    orderCode: e.order.code,
    orderEmoji: e.order.emoji,
    serviceName: e.order.serviceName,
    status: e.status,
    message: e.message,
    createdAt: e.createdAt,
    read: e.createdAt <= since,
  }));

  const unread = out.filter((n) => !n.read).length;

  return NextResponse.json({ notifications: out, unread });
}

/**
 * POST /api/notifications { action: "markAllRead" }
 * Sets user.lastSeenNotificationsAt = now.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (body?.action === "markAllRead") {
    await db.user.update({
      where: { id: session.user.id },
      data: { lastSeenNotificationsAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "BAD_ACTION" }, { status: 400 });
}
