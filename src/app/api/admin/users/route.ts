import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

/**
 * GET /api/admin/users
 * Admin-only — returns all users with order counts, wallet balances, and
 * total spent. Supports `?q=` search by name/email.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const where: any = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await db.user.findMany({
    where,
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

  // Compute total spent per user (sum of COMPLETED + PARTIAL order totals)
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

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      banned: u.banned,
      createdAt: u.createdAt,
      walletBalance: u.wallet?.balance ?? 0,
      totalOrders: u._count.orders,
      totalTickets: u._count.supportTickets,
      totalSpent: spendMap.get(u.id) ?? 0,
    })),
  });
}
