import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

const UpdateBody = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام حداقل ۲ کاراکتر")
    .max(80, "نام بسیار طولانی")
    .optional()
    .or(z.literal("")),
});

/**
 * PATCH /api/profile
 * Updates the user's profile (currently just name). Email is read-only
 * (changing email requires verification — out of scope).
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  let body: z.infer<typeof UpdateBody>;
  try {
    body = UpdateBody.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: e?.errors ?? e?.message },
      { status: 400 }
    );
  }

  const data: any = {};
  if (body.name !== undefined) data.name = body.name || null;

  const user = await db.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}

/**
 * GET /api/profile
 * Returns the current user's profile + stats (orders count, wallet balance,
 * total spent, member since).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const [user, wallet, orderStats] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),
    db.wallet.findUnique({
      where: { userId: session.user.id },
      select: { balance: true },
    }),
    db.order.aggregate({
      where: { userId: session.user.id },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
    stats: {
      walletBalance: wallet?.balance ?? 0,
      totalOrders: orderStats._count,
      totalSpent: orderStats._sum.totalAmount ?? 0,
    },
  });
}
