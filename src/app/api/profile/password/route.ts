import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

const Body = z.object({
  currentPassword: z.string().min(1, "رمز فعلی الزامی است"),
  newPassword: z
    .string()
    .min(8, "رمز جدید حداقل ۸ کاراکتر")
    .max(72, "رمز جدید بسیار طولانی"),
});

/**
 * PATCH /api/profile/password
 * Changes the user's password. Requires the current password to be correct.
 */
export async function PATCH(req: Request) {
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

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const ok = await compare(body.currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "WRONG_PASSWORD", message: "رمز عبور فعلی اشتباه است." },
      { status: 400 }
    );
  }

  // Prevent same password
  const sameAsOld = await compare(body.newPassword, user.passwordHash);
  if (sameAsOld) {
    return NextResponse.json(
      { error: "SAME_PASSWORD", message: "رمز جدید نباید با رمز فعلی یکسان باشد." },
      { status: 400 }
    );
  }

  const newHash = await hash(body.newPassword, 10);
  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ ok: true });
}
