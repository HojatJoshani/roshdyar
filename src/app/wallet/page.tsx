import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, ensureWallet } from "@/lib/session";
import { SiteShell } from "@/components/brand/site-shell";
import { ServiceBreadcrumb } from "@/components/brand/service-breadcrumb";
import { WalletView, type WalletTxRow } from "./wallet-view";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ amount?: string }>;
}

export default async function WalletPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login?reason=auth&from=/wallet");

  const sp = await searchParams;
  const initialDepositOpen = !!sp.amount;

  await ensureWallet(session.id);

  const [wallet, txs] = await Promise.all([
    db.wallet.findUnique({ where: { userId: session.id } }),
    db.walletTransaction.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const balance = wallet?.balance ?? 0;

  // Strip any sensitive fields — keep only what's needed for display.
  const rows: WalletTxRow[] = txs.map((t) => ({
    id: t.id,
    direction: t.direction as "CREDIT" | "DEBIT",
    amount: t.amount,
    balanceAfter: t.balanceAfter,
    type: t.type as "DEPOSIT" | "ORDER_PAYMENT" | "REFUND" | "ADMIN_ADJUST",
    description: t.description,
    reference: t.reference ?? null,
    orderId: t.orderId ?? null,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-mesh-brand">
        <div className="container mx-auto px-4 py-8">
          <ServiceBreadcrumb
            items={[
              { label: "خانه", href: "/" },
              { label: "کیف پول" },
            ]}
            className="mb-4"
          />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                کیف پول
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                موجودی، شارژ حساب و تاریخچه تراکنش‌های شما — همه در یک نگاه.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-10">
        <WalletView initialBalance={balance} transactions={rows} initialDepositOpen={initialDepositOpen} />
      </section>
    </SiteShell>
  );
}
