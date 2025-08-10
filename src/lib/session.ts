import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export async function getSession(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    role: session.user.role,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const u = await getSession();
  if (!u) redirect("/login?reason=auth");
  return u;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect("/");
  return u;
}

/** Get wallet balance for a user, returns 0 if wallet missing. */
export async function getWalletBalance(userId: string): Promise<number> {
  const w = await db.wallet.findUnique({ where: { userId } });
  return w?.balance ?? 0;
}

/** Ensure user has a wallet row. Safe to call multiple times. */
export async function ensureWallet(userId: string) {
  return await db.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 },
  });
}
