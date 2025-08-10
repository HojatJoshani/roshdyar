import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { ensureWallet } from "@/lib/session";

const Body = z.object({
  email: z.string().email("ایمیل نامعتبر است").toLowerCase(),
  password: z
    .string()
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
    .max(72, "رمز عبور بسیار طولانی است"),
  name: z.string().trim().min(2, "نام را وارد کنید").max(80).optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: e?.errors ?? e?.message },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({
    where: { email: body.email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "EMAIL_TAKEN", message: "این ایمیل قبلاً ثبت شده است." },
      { status: 409 }
    );
  }

  const user = await db.user.create({
    data: {
      email: body.email,
      name: body.name ?? null,
      role: "CUSTOMER",
      passwordHash: await hash(body.password, 10),
    },
  });
  await ensureWallet(user.id);

  // Optionally give a small welcome credit in dev
  if (process.env.NODE_ENV !== "production") {
    await db.wallet.update({
      where: { userId: user.id },
      data: { balance: 50000 },
    });
    await db.walletTransaction.create({
      data: {
        walletId: (await db.wallet.findUnique({ where: { userId: user.id } }))!.id,
        userId: user.id,
        direction: "CREDIT",
        amount: 50000,
        balanceAfter: 50000,
        type: "ADMIN_ADJUST",
        description: "اعتبار خوش‌آمدگویی (محیط توسعه)",
        reference: "welcome",
      },
    });
  }

  return NextResponse.json({ ok: true, userId: user.id });
}
