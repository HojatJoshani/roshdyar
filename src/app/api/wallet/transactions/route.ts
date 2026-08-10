import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { ensureWallet } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  await ensureWallet(session.user.id);
  const url = new URL(req.url);
  const limit = Math.min(50, Number(url.searchParams.get("limit") ?? "50"));

  const txs = await db.walletTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const out = txs.map((t) => ({
    id: t.id,
    direction: t.direction,
    amount: t.amount,
    balanceAfter: t.balanceAfter,
    type: t.type,
    description: t.description,
    reference: t.reference,
    orderId: t.orderId,
    paymentId: t.paymentId,
    createdAt: t.createdAt,
  }));

  return NextResponse.json({ transactions: out });
}
