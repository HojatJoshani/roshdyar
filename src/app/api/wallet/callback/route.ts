import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { creditWallet } from "@/lib/wallet";

/**
 * Mock ZarinPal callback verifier.
 * In production this would POST to https://api.zarinpal.com/pg/v4/payment/verify.json
 * with { merchant_id, authority, amount } and check the returned code === 100.
 * For the mock we trust Status=OK and verify idempotently.
 */
const Query = z.object({
  Authority: z.string().min(1),
  Status: z.string(),
  paymentId: z.string().min(1),
});

export async function POST(req: Request) {
  let q: z.infer<typeof Query>;
  try {
    const url = new URL(req.url);
    q = Query.parse({
      Authority: url.searchParams.get("Authority") ?? "",
      Status: url.searchParams.get("Status") ?? "",
      paymentId: url.searchParams.get("paymentId") ?? "",
    });
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const payment = await db.payment.findUnique({
    where: { id: q.paymentId },
  });
  if (!payment) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (payment.status === "PAID") {
    // Idempotent — already settled
    return NextResponse.json({ ok: true, alreadyPaid: true, refId: payment.refId });
  }
  if (payment.authority !== q.Authority) {
    return NextResponse.json({ error: "AUTHORITY_MISMATCH" }, { status: 400 });
  }
  if (q.Status !== "OK") {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", gatewayMeta: JSON.stringify({ status: q.Status }) },
    });
    return NextResponse.json({ ok: false, error: "USER_CANCELED" });
  }

  // Settle: mark PAID + credit wallet atomically.
  const refId = "ZP" + Date.now().toString(36).toUpperCase();
  const tx = await creditWallet({
    userId: payment.userId,
    direction: "CREDIT",
    amount: payment.amount,
    type: "DEPOSIT",
    description: `شارژ کیف پول از درگاه زرین‌پال`,
    reference: payment.id,
    paymentId: payment.id,
  });

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      refId,
      walletTxId: tx.txId,
      gatewayMeta: JSON.stringify({ mock: true, status: "OK" }),
    },
  });

  return NextResponse.json({ ok: true, refId, balanceAfter: tx.balanceAfter });
}
