import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Internal worker endpoint. Called by the background worker mini-service
 * to: (1) fetch pending+confirmed orders to place with provider, (2) fetch
 * in-progress orders to poll status, (3) report back results.
 *
 * Protected by a shared secret header X-Worker-Key (env WORKER_KEY).
 * This route is NEVER called from the client.
 */

const WORKER_KEY = process.env.WORKER_KEY ?? "dev-worker-key";

function authed(req: Request) {
  return req.headers.get("x-worker-key") === WORKER_KEY;
}

export async function GET(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Orders needing provider placement
  const toPlaceRaw = await db.order.findMany({
    where: { status: "PAYMENT_CONFIRMED" },
    take: 20,
    orderBy: { createdAt: "asc" },
  });

  // Re-resolve providerServiceId for each pending order
  const toPlace = [];
  for (const o of toPlaceRaw) {
    const tier = await db.serviceTier.findFirst({
      where: {
        service: { slug: o.serviceSlug },
        tier: o.tier,
      },
    });
    toPlace.push({
      id: o.id,
      userId: o.userId,
      code: o.code,
      quantity: o.quantity,
      targetLink: o.targetLink,
      providerKey: tier?.providerKey ?? "mock",
      providerServiceId: tier?.providerServiceId ?? "unknown",
    });
  }

  // Orders to poll
  const toPollRaw = await db.order.findMany({
    where: {
      status: { in: ["PROCESSING", "IN_PROGRESS"] },
      providerOrderId: { not: null },
    },
    take: 50,
    orderBy: { updatedAt: "asc" },
  });
  const toPoll = toPollRaw.map((o) => ({
    id: o.id,
    userId: o.userId,
    code: o.code,
    providerOrderId: o.providerOrderId!,
    quantity: o.quantity,
  }));

  return NextResponse.json({ toPlace, toPoll });
}

/**
 * POST — worker reports back: placed an order (sets providerOrderId +
 * status PROCESSING + writes OrderEvent), or polled status (updates
 * status + counts + writes OrderEvent, and on PARTIAL/FAILED triggers
 * a refund via the wallet ledger).
 */
export async function POST(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await req.json();
  const { action } = body;

  if (action === "placed") {
    await db.order.update({
      where: { id: body.orderId },
      data: {
        providerOrderId: body.providerOrderId,
        status: "PROCESSING",
        startedCount: body.startedCount ?? 0,
        remainsCount: body.remainsCount ?? 0,
      },
    });
    await db.orderEvent.create({
      data: {
        orderId: body.orderId,
        userId: body.userId ?? "system",
        status: "PROCESSING",
        message: "سفارش به تأمین‌کننده ارسال شد.",
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "status") {
    const order = await db.order.findUnique({
      where: { id: body.orderId },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        quantity: true,
        userId: true,
        code: true,
      },
    });
    if (!order)
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const newStatus = body.status;
    const mapped =
      newStatus === "in_progress"
        ? "IN_PROGRESS"
        : newStatus === "completed"
        ? "COMPLETED"
        : newStatus === "partial"
        ? "PARTIAL"
        : newStatus === "failed"
        ? "FAILED"
        : null;
    if (!mapped)
      return NextResponse.json({ error: "BAD_STATUS" }, { status: 400 });

    const rank: Record<string, number> = {
      PENDING: 0,
      PAYMENT_CONFIRMED: 1,
      PROCESSING: 2,
      IN_PROGRESS: 3,
      COMPLETED: 4,
      PARTIAL: 4,
      FAILED: 4,
    };
    if (rank[mapped] < rank[order.status]) {
      return NextResponse.json({ ok: true, skipped: "backward" });
    }

    await db.order.update({
      where: { id: order.id },
      data: {
        status: mapped,
        startedCount: body.startedCount ?? order.quantity,
        remainsCount: body.remainsCount ?? 0,
        completedCount: body.completedCount ?? 0,
      },
    });

    await db.orderEvent.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        status: mapped,
        message: body.message ?? "وضعیت سفارش به‌روزرسانی شد.",
      },
    });

    // Refund on PARTIAL or FAILED — credit back the undelivered portion.
    if (mapped === "PARTIAL" || mapped === "FAILED") {
      const delivered = body.completedCount ?? 0;
      const deliveredRatio = Math.min(
        1,
        delivered / Math.max(1, order.quantity)
      );
      const refundAmount = Math.round(
        order.totalAmount * (1 - deliveredRatio)
      );
      if (refundAmount > 0) {
        const existing = await db.walletTransaction.findFirst({
          where: { reference: order.id, type: "REFUND" },
        });
        if (!existing) {
          const { creditWallet } = await import("@/lib/wallet");
          await creditWallet({
            userId: order.userId,
            direction: "CREDIT",
            amount: refundAmount,
            type: "REFUND",
            description: `بازگشت وجه سفارش ${order.code} (${
              mapped === "PARTIAL" ? "تحویل ناقص" : "ناموفق"
            })`,
            reference: order.id,
            orderId: order.id,
          });
          await db.orderEvent.create({
            data: {
              orderId: order.id,
              userId: order.userId,
              status: mapped,
              message: `مبلغ ${refundAmount.toLocaleString("fa-IR")} تومان به‌عنوان جبران به کیف پول شما بازگردانده شد.`,
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "BAD_ACTION" }, { status: 400 });
}
