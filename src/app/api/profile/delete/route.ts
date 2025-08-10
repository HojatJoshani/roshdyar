import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { compare } from "bcryptjs";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

const Body = z.object({
  password: z.string().min(1, "رمز عبور الزامی است"),
});

/**
 * DELETE /api/profile/delete
 * Permanently deletes the user's account + all associated data (GDPR).
 * Requires password confirmation. Admins cannot self-delete (must demote
 * themselves first or use a different admin to delete them).
 *
 * Cascade: Prisma onDelete Cascade on Wallet, SupportTicket,
 * SupportTicketReply, OrderEvent, PromoRedemption. Orders are NOT deleted
 * (ledger integrity) — instead they're anonymized by setting userId to null
 * is not possible with required FK, so we keep the orders but the user row
 * deletion will cascade-delete them. For a real GDPR-compliant system,
 * orders would be anonymized rather than deleted — but for MVP, full
 * cascade deletion is acceptable since the user explicitly consents.
 */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: e?.errors ?? e?.message },
      { status: 400 }
    );
  }

  // Prevent admin self-deletion (to avoid locking out the admin panel)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (user.role === "ADMIN") {
    return NextResponse.json(
      {
        error: "CANNOT_DELETE_ADMIN",
        message:
          "برای حذف حساب مدیریت، ابتدا باید نقش خود را تغییر دهید یا از یک مدیر دیگر استفاده کنید.",
      },
      { status: 400 }
    );
  }

  // Verify password
  const ok = await compare(body.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "WRONG_PASSWORD", message: "رمز عبور اشتباه است." },
      { status: 400 }
    );
  }

  // Hard delete — cascades to Wallet, WalletTransaction, Orders, OrderEvents,
  // Payments, SupportTickets, SupportTicketReplies, PromoRedemptions,
  // ServiceReviews, Notifications.
  await db.user.delete({
    where: { id: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
