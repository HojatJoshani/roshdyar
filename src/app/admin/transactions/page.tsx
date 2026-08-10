import { db } from "@/lib/db";
import { AdminTransactionsTable, AdminTx } from "./admin-transactions-table";
import { TxType } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const txs = await db.walletTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  const rows: AdminTx[] = txs.map((t) => ({
    id: t.id,
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
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">تراکنش‌ها</h1>
        <p className="text-sm text-muted-foreground">
          دفتر ثبت تغییرات کیف پول همه کاربران.
        </p>
      </div>
      <AdminTransactionsTable transactions={rows} />
    </div>
  );
}
