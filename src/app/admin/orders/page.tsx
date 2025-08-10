import { db } from "@/lib/db";
import { AdminOrdersTable, AdminOrder } from "./admin-orders-table";
import { OrderStatus } from "@/lib/constants";
import { CsvExportButton } from "@/components/brand/csv-export-button";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  const rows: AdminOrder[] = orders.map((o) => ({
    id: o.id,
    code: o.code,
    userId: o.userId,
    userEmail: o.user?.email ?? null,
    userName: o.user?.name ?? null,
    serviceName: o.serviceName,
    serviceSlug: o.serviceSlug,
    platform: o.platform,
    category: o.category,
    tier: o.tier,
    tierDisplay: o.tierDisplay,
    emoji: o.emoji,
    quantity: o.quantity,
    unitPricePer1000: o.unitPricePer1000,
    totalAmount: o.totalAmount,
    targetLink: o.targetLink,
    notes: o.notes,
    status: o.status as OrderStatus,
    startedCount: o.startedCount,
    remainsCount: o.remainsCount,
    completedCount: o.completedCount,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">سفارش‌ها</h1>
          <p className="text-sm text-muted-foreground">
            مدیریت همه سفارش‌ها. برای بازگشت وجه، صفحه سفارش را باز کنید.
          </p>
        </div>
        {rows.length > 0 && (
          <CsvExportButton
            url="/api/admin/orders/export"
            label="خروجی CSV (همه)"
          />
        )}
      </div>
      <AdminOrdersTable orders={rows} />
    </div>
  );
}
