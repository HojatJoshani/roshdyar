import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { ensureWallet } from "@/lib/session";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  await ensureWallet(session.user.id);
  const w = await db.wallet.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ balance: w?.balance ?? 0 });
}
