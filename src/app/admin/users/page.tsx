import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { AdminShell } from "../admin-shell";
import { UsersManager } from "./users-manager";

export const dynamic = "force-dynamic";

async function getUsers() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      banned: true,
      createdAt: true,
      wallet: { select: { balance: true } },
      _count: {
        select: {
          orders: true,
          supportTickets: true,
        },
      },
    },
  });

  // Compute total spent per user
  const userIds = users.map((u) => u.id);
  const spendAgg = await db.order.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      status: { in: ["COMPLETED", "PARTIAL", "IN_PROGRESS", "PROCESSING"] },
    },
    _sum: { totalAmount: true },
  });
  const spendMap = new Map(spendAgg.map((s) => [s.userId, s._sum.totalAmount ?? 0]));

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    banned: u.banned,
    createdAt: u.createdAt.toISOString(),
    walletBalance: u.wallet?.balance ?? 0,
    totalOrders: u._count.orders,
    totalTickets: u._count.supportTickets,
    totalSpent: spendMap.get(u.id) ?? 0,
  }));
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await getUsers();
  return (
    <AdminShell>
      <UsersManager initialUsers={users} />
    </AdminShell>
  );
}
