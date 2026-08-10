import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { TxType } from "@/lib/wallet";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const txs = await db.walletTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  const out = txs.map((t) => ({
    id: t.id,
    walletId: t.walletId,
    userId: t.userId,
    userEmail: t.user?.email ?? null,
    userName: t.user?.name ?? null,
    direction: t.direction as "CREDIT" | "DEBIT",
    amount: t.amount,
    balanceAfter: t.balanceAfter,
    type: t.type as TxType,
    description: t.description,
    reference: t.reference,
    orderId: t.orderId,
    paymentId: t.paymentId,
    createdAt: t.createdAt,
  }));

  return NextResponse.json({ transactions: out });
}
