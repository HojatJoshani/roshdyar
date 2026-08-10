import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

const CreateBody = z.object({
  code: z
    .string()
    .trim()
    .min(3, "کد حداقل ۳ کاراکتر")
    .max(40, "کد بسیار طولانی")
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z0-9_-]+$/.test(v), "کد فقط شامل حروف انگلیسی، عدد و خط تیره"),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z
    .number()
    .int()
    .positive("مقدار باید مثبت باشد")
    .refine((v) => v <= 100, "درصد نمی‌تواند بیشتر از ۱۰۰ باشد"),
  appliesTo: z.string().trim().default("ALL"),
  maxUses: z.number().int().min(0).default(0),
  perUserLimit: z.number().int().min(0).default(1),
  minOrderAmount: z.number().int().min(0).default(0),
  expiresAt: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const promos = await db.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { redemptions: true } },
      redemptions: {
        where: { createdAt: { gte: new Date(Date.now() - 14 * 86400 * 1000) } },
        select: { createdAt: true },
      },
    },
  });

  // Build 14-day sparkline data per promo
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);
  const dayKeys: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  return NextResponse.json({
    promos: promos.map((p) => {
      const bucket = new Map<string, number>();
      for (const k of dayKeys) bucket.set(k, 0);
      for (const r of p.redemptions) {
        const key = r.createdAt.toISOString().slice(0, 10);
        if (bucket.has(key)) bucket.set(key, (bucket.get(key) ?? 0) + 1);
      }
      return {
        id: p.id,
        code: p.code,
        description: p.description,
        type: p.type,
        value: p.value,
        appliesTo: p.appliesTo,
        maxUses: p.maxUses,
        usedCount: p.usedCount,
        redemptionCount: p._count.redemptions,
        perUserLimit: p.perUserLimit,
        minOrderAmount: p.minOrderAmount,
        expiresAt: p.expiresAt,
        isActive: p.isActive,
        createdAt: p.createdAt,
        sparkline: dayKeys.map((k) => ({
          date: new Intl.DateTimeFormat("fa-IR", {
            month: "numeric",
            day: "numeric",
          }).format(new Date(k + "T00:00:00")),
          count: bucket.get(k) ?? 0,
        })),
      };
    }),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  let body: z.infer<typeof CreateBody>;
  try {
    body = CreateBody.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: e?.errors ?? e?.message },
      { status: 400 }
    );
  }

  const existing = await db.promoCode.findUnique({
    where: { code: body.code },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "CODE_TAKEN", message: "این کد قبلاً ثبت شده است." },
      { status: 409 }
    );
  }

  const expiresAt =
    body.expiresAt && body.expiresAt.trim()
      ? new Date(body.expiresAt)
      : null;

  const promo = await db.promoCode.create({
    data: {
      code: body.code,
      description: body.description || null,
      type: body.type,
      value: body.value,
      appliesTo: body.appliesTo,
      maxUses: body.maxUses,
      perUserLimit: body.perUserLimit,
      minOrderAmount: body.minOrderAmount,
      expiresAt,
      isActive: body.isActive,
    },
  });
  return NextResponse.json({ ok: true, promo });
}
