import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

/**
 * PATCH /api/admin/users/[id]
 * Admin-only — toggle banned status. Cannot ban yourself or other admins.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const targetUser = await db.user.findUnique({
    where: { id },
    select: { id: true, role: true, banned: true },
  });
  if (!targetUser) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Prevent self-ban + admin-ban
  if (targetUser.id === session.user.id) {
    return NextResponse.json(
      { error: "CANNOT_BAN_SELF", message: "نمی‌توانید حساب خودتان را مسدود کنید." },
      { status: 400 }
    );
  }
  if (targetUser.role === "ADMIN") {
    return NextResponse.json(
      { error: "CANNOT_BAN_ADMIN", message: "نمی‌توانید مدیران را مسدود کنید." },
      { status: 400 }
    );
  }

  const newBanned = body.banned === true;
  const updated = await db.user.update({
    where: { id },
    data: { banned: newBanned },
    select: { id: true, banned: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
