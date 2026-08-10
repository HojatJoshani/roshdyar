import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { AdminShell } from "../admin-shell";
import { HealthDashboard } from "./health-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getHealthData() {
  const [
    totalUsers,
    totalOrders,
    totalServices,
    totalWalletTransactions,
    totalRevenue,
    pendingOrders,
    completedOrders,
    failedOrders,
    recentOrderEvents,
    dbFile,
    workerHealth,
  ] = await Promise.all([
    db.user.count(),
    db.order.count(),
    db.service.count(),
    db.walletTransaction.count(),
    db.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "ORDER_PAYMENT", direction: "DEBIT" },
    }),
    db.order.count({
      where: {
        status: { in: ["PENDING", "PAYMENT_CONFIRMED", "PROCESSING", "IN_PROGRESS"] },
      },
    }),
    db.order.count({ where: { status: "COMPLETED" } }),
    db.order.count({ where: { status: { in: ["FAILED", "PARTIAL"] } } }),
    db.orderEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        message: true,
        createdAt: true,
        orderId: true,
        order: { select: { code: true } },
      },
    }),
    // DB file size — read from the filesystem
    (async () => {
      try {
        const { promises: fs } = await import("fs");
        const path = await import("path");
        const dbPath = path.join(process.cwd(), "db", "custom.db");
        const stat = await fs.stat(dbPath);
        return stat.size;
      } catch {
        return null;
      }
    })(),
    // Worker health check
    (async () => {
      try {
        const r = await fetch("http://localhost:3003/", {
          signal: AbortSignal.timeout(3000),
        });
        if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
        const d = await r.json();
        return {
          ok: true as const,
          lastTick: d.lastTick as string,
        };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "unreachable" };
      }
    })(),
  ]);

  return {
    db: {
      totalUsers,
      totalOrders,
      totalServices,
      totalWalletTransactions,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      pendingOrders,
      completedOrders,
      failedOrders,
      dbFileSizeBytes: dbFile,
    },
    recentEvents: recentOrderEvents.map((e) => ({
      id: e.id,
      status: e.status,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
      orderCode: e.order.code,
    })),
    worker: workerHealth,
  };
}

export default async function AdminHealthPage() {
  await requireAdmin();
  const data = await getHealthData();
  return (
    <AdminShell>
      <HealthDashboard data={data} />
    </AdminShell>
  );
}
