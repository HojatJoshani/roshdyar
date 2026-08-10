import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SiteShell } from "@/components/brand/site-shell";
import { ServiceBreadcrumb } from "@/components/brand/service-breadcrumb";
import { OrdersList, type OrderRowData } from "./orders-list";
import { CsvExportButton } from "@/components/brand/csv-export-button";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?reason=auth&from=/orders");

  const orders = await db.order.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Strip provider-only fields and any sensitive data before passing to client.
  const rows: OrderRowData[] = orders.map((o) => ({
    id: o.id,
    code: o.code,
    serviceName: o.serviceName,
    serviceSlug: o.serviceSlug,
    platform: o.platform,
    category: o.category,
    tier: o.tier as "ECONOMY" | "STANDARD" | "PREMIUM",
    tierDisplay: o.tierDisplay,
    emoji: o.emoji,
    quantity: o.quantity,
    unitPricePer1000: o.unitPricePer1000,
    totalAmount: o.totalAmount,
    discountAmount: o.discountAmount,
    promoCode: o.promoCode,
    targetLink: o.targetLink,
    status: o.status as
      | "PENDING"
      | "PAYMENT_CONFIRMED"
      | "PROCESSING"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "PARTIAL"
      | "FAILED",
    completedCount: o.completedCount,
    createdAt: o.createdAt.toISOString(),
  }));

  const inProgress = rows.filter(
    (o) =>
      o.status === "PAYMENT_CONFIRMED" ||
      o.status === "PROCESSING" ||
      o.status === "IN_PROGRESS"
  ).length;
  const completed = rows.filter(
    (o) => o.status === "COMPLETED"
  ).length;
  const failed = rows.filter(
    (o) => o.status === "FAILED" || o.status === "PARTIAL"
  ).length;

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-mesh-brand">
        <div className="container mx-auto px-4 py-8">
          <ServiceBreadcrumb
            items={[
              { label: "خانه", href: "/" },
              { label: "سفارش‌های من" },
            ]}
            className="mb-4"
          />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                سفارش‌های من
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                تمام سفارش‌های شما در یک نگاه. برای مشاهده جزئیات و رهگیری
                لحظه‌ای، روی هر سفارش کلیک کنید.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CountPill label="همه" value={rows.length} />
              <CountPill label="در حال انجام" value={inProgress} tone="info" />
              <CountPill label="تکمیل شده" value={completed} tone="success" />
              <CountPill label="ناموفق" value={failed} tone="danger" />
              {rows.length > 0 && (
                <CsvExportButton url="/api/orders/export" label="خروجی CSV" />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-10">
        <OrdersList orders={rows} />
      </section>
    </SiteShell>
  );
}

function CountPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "info" | "success" | "danger";
}) {
  const toneClass = {
    neutral: "border-border bg-card text-muted-foreground",
    info: "border-primary/20 bg-primary/5 text-primary",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    danger: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${toneClass}`}
    >
      {label}
      <span className="tnum rounded-full bg-background/60 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
        {new Intl.NumberFormat("fa-IR").format(value)}
      </span>
    </span>
  );
}
