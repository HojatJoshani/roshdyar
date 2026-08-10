import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

/**
 * POST /api/admin/users/[id]/impersonate
 * Admin-only — starts impersonating the target user by encoding a new JWT
 * with the target user's ID + role + an `impersonating` object containing
 * the admin's original identity. The admin's session is replaced.
 *
 * Uses NextAuth's `encode` to mint a new JWT cookie directly.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  // Can't impersonate if already impersonating
  if ((session as any).impersonating) {
    return NextResponse.json(
      { error: "ALREADY_IMPERSONATING", message: "ابتدا از جعل هویت فعلی خارج شوید." },
      { status: 400 }
    );
  }

  const target = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, banned: true },
  });
  if (!target) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  // Don't impersonate other admins (to prevent privilege escalation confusion)
  if (target.role === "ADMIN") {
    return NextResponse.json(
      { error: "CANNOT_IMPERSONATE_ADMIN", message: "نمی‌توانید هویت مدیران را جعل کنید." },
      { status: 400 }
    );
  }

  // We return the impersonation payload; the client calls `signIn` with
  // a custom credentials provider that accepts this payload. But since we
  // don't have a separate provider, we use the `update` mechanism via
  // `session()`. The simplest approach: return the payload and have the
  // client call a signIn with a special "impersonate" credentials provider.
  //
  // Actually the cleanest way with JWT is to encode the token server-side
  // and set the cookie. NextAuth exports `encode` for this.
  const { encode, defaultCookies } = await import("next-auth/jwt");
  const cookies = await import("next/headers");

  const newToken = {
    id: target.id,
    role: target.role,
    impersonating: {
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetUserId: target.id,
      targetUserName: target.name,
      targetUserEmail: target.email,
    },
  };

  const encoded = await encode({
    token: newToken,
    secret:
      process.env.NEXTAUTH_SECRET ??
      "dev-secret-change-me-in-production-roshdgar",
    maxAge: 30 * 24 * 60 * 60, // 30 days like default
  });

  const cookieStore = await cookies.cookies();
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";
  // Delete any stale authjs.session-token cookie from previous attempts
  cookieStore.delete("authjs.session-token");
  cookieStore.set(cookieName, encoded, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  // Audit log
  await db.auditLog.create({
    data: {
      action: "IMPERSONATE_START",
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetUserId: target.id,
      targetUserEmail: target.email,
      metadata: JSON.stringify({ targetName: target.name }),
    },
  });

  return NextResponse.json({
    ok: true,
    targetUser: {
      id: target.id,
      email: target.email,
      name: target.name,
    },
  });
}
