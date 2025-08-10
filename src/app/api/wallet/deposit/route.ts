/**
 * Mock ZarinPal gateway.
 *
 * In production this would call ZarinPal's /pg/v4/payment/request.json to get
 * an authority, then redirect the user to https://www.zarinpal.com/pg/StartPay/{authority}.
 * For the MVP / sandbox we generate a fake authority and a mock verify.
 *
 * Idempotency: a Payment row is created PENDING; the callback verifies
 * status (always success in mock unless ?Status=NOK), marks PAID, and
 * credits the wallet via the ledger service (atomic, with balanceAfter).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { ensureWallet } from "@/lib/session";
import { creditWallet } from "@/lib/wallet";

const Body = z.object({
  amount: z.number().int().positive().max(50_000_000), // up to 50M Toman
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: e?.errors ?? e?.message },
      { status: 400 }
    );
  }

  await ensureWallet(session.user.id);

  // Create a PENDING payment with a mock authority
  const authority =
    "MOCK" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 8).toUpperCase();

  const payment = await db.payment.create({
    data: {
      userId: session.user.id,
      amount: body.amount,
      gateway: "zarinpal",
      status: "PENDING",
      authority,
    },
  });

  // In production, return ZarinPal's gateway URL. For the mock we return
  // our own /wallet/callback page which immediately completes the payment.
  const callbackUrl = `/wallet/callback?Authority=${authority}&Status=OK&paymentId=${payment.id}`;

  return NextResponse.json({
    paymentId: payment.id,
    authority,
    redirectUrl: callbackUrl,
  });
}
