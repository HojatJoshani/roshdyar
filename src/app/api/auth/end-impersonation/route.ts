import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * POST /api/auth/end-impersonation
 * Ends an active impersonation session by restoring the admin's original
 * JWT. Uses NextAuth's `update` trigger in the jwt callback to swap the
 * token back to the admin's identity.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!(session.user as any).impersonating) {
    return NextResponse.json(
      { error: "NOT_IMPERSONATING", message: "در حال حاضر جعل هویتی فعال نیست." },
      { status: 400 }
    );
  }

  const adminId = (session.user as any).impersonating.adminId;

  // Mint a new JWT with the admin's original identity
  const { encode } = await import("next-auth/jwt");
  const cookies = await import("next/headers");

  const newToken = {
    id: adminId,
    role: "ADMIN",
    // no impersonating field = not impersonating
  };

  const encoded = await encode({
    token: newToken,
    secret:
      process.env.NEXTAUTH_SECRET ??
      "dev-secret-change-me-in-production-roshdgar",
    maxAge: 30 * 24 * 60 * 60,
  });

  const cookieStore = await cookies.cookies();
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";
  cookieStore.set(cookieName, encoded, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  // Audit log
  const { db } = await import("@/lib/db");
  await db.auditLog.create({
    data: {
      action: "IMPERSONATE_END",
      adminId: adminId,
      adminEmail: (session.user as any).impersonating.adminEmail,
      targetUserId: (session.user as any).impersonating.targetUserId,
      targetUserEmail: (session.user as any).impersonating.targetUserEmail,
    },
  });

  return NextResponse.json({ ok: true });
}
