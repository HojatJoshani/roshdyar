import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { ensureWallet } from "@/lib/session";
import { creditWallet } from "@/lib/wallet";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: { amount?: number; reason?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const order = await db.order.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      userId: true,
      totalAmount: true,
      unitPricePer1000: true,
      quantity: true,
      completedCount: true,
      status: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Idempotency: check if a REFUND walletTx already exists for this order
  const existingRefund = await db.walletTransaction.findFirst({
    where: { reference: order.id, type: "REFUND" },
    select: { id: true, amount: true },
  });
  if (existingRefund) {
    return NextResponse.json(
      {
        ok: true,
        alreadyRefunded: true,
        refundTxId: existingRefund.id,
        amount: existingRefund.amount,
        message: "این سفارش قبلاً بازگشت وجه شده است.",
      },
      { status: 200 }
    );
  }

  // Determine refund amount:
  // - explicit body.amount overrides everything (admin may refund custom)
  // - FAILED → full totalAmount
  // - PARTIAL → (quantity - completedCount) / 1000 * unitPricePer1000
  let amount: number;
  let reasonLabel: string;
  if (typeof body.amount === "number" && body.amount > 0) {
    amount = Math.trunc(body.amount);
    reasonLabel = body.reason?.trim() || "بازگشت وجه دستی توسط مدیریت";
  } else if (order.status === "PARTIAL") {
    const undelivered = Math.max(0, order.quantity - order.completedCount);
    amount = Math.round((undelivered / 1000) * order.unitPricePer1000);
    reasonLabel = `بازگشت وجه به‌خاطر تحویل ناقص (${undelivered} واحد تحویل‌نشده)`;
  } else {
    // FAILED or any other → refund full total
    amount = order.totalAmount;
    reasonLabel = "بازگشت وجه به‌خاطر ناموفق بودن سفارش";
  }

  if (amount <= 0) {
    return NextResponse.json(
      {
        error: "INVALID_AMOUNT",
        message: "مبلغ بازگشتی باید بزرگ‌تر از صفر باشد.",
      },
      { status: 400 }
    );
  }

  // Ensure wallet exists for user
  await ensureWallet(order.userId);

  // Credit the wallet
  const result = await creditWallet({
    userId: order.userId,
    direction: "CREDIT",
    amount,
    type: "REFUND",
    description: `بازگشت وجه سفارش ${order.code}`,
    reference: order.id,
    orderId: order.id,
  });

  // Update order status — if not already FAILED, mark as FAILED (admin-triggered refund ends the order)
  const newStatus = order.status === "PARTIAL" ? "PARTIAL" : "FAILED";
  const shouldUpdateStatus = order.status !== "FAILED" && order.status !== "COMPLETED";
  if (shouldUpdateStatus) {
    await db.order.update({
      where: { id: order.id },
      data: { status: newStatus },
    });
  }

  // Append an OrderEvent with the refund note
  await db.orderEvent.create({
    data: {
      orderId: order.id,
      userId: session.user.id,
      status: newStatus,
      message: `${reasonLabel}. مبلغ بازگشتی: ${amount.toLocaleString("en-US")} تومان.`,
      meta: JSON.stringify({
        refundTxId: result.txId,
        amount,
        reason: reasonLabel,
        adminId: session.user.id,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    alreadyRefunded: false,
    refundTxId: result.txId,
    amount,
    newStatus,
    balanceAfter: result.balanceAfter,
  });
}
