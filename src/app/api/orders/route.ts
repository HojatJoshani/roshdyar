import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { ensureWallet } from "@/lib/session";
import { generateOrderCode } from "@/lib/format";
import { payOrderFromWallet } from "@/lib/wallet";

const CreateOrder = z.object({
  serviceTierId: z.string().min(1),
  quantity: z.number().int().positive(),
  targetLink: z
    .string()
    .trim()
    .min(1, "لینک هدف الزامی است")
    .max(500, "لینک بسیار طولانی است")
    .refine(
      (v) => /^https?:\/\//i.test(v),
      "لینک باید با http:// یا https:// شروع شود"
    ),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  acceptedTerms: z.boolean().refine((v) => v === true, {
    message: "پذیرش قوانین الزامی است",
  }),
  pay: z.boolean().default(true), // if true, attempt to debit wallet immediately
  promoCode: z.string().trim().max(40).optional().or(z.literal("")),
});

// Validate link matches platform
function linkMatchesPlatform(link: string, platform: string): boolean {
  const l = link.toLowerCase();
  if (platform === "INSTAGRAM") return l.includes("instagram.com");
  if (platform === "YOUTUBE") return l.includes("youtube.com") || l.includes("youtu.be");
  return true;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  // Strip provider fields
  const out = orders.map((o) => ({
    id: o.id,
    code: o.code,
    serviceName: o.serviceName,
    serviceSlug: o.serviceSlug,
    platform: o.platform,
    category: o.category,
    tier: o.tier,
    tierDisplay: o.tierDisplay,
    emoji: o.emoji,
    quantity: o.quantity,
    unitPricePer1000: o.unitPricePer1000,
    totalAmount: o.totalAmount,
    discountAmount: o.discountAmount,
    promoCode: o.promoCode,
    targetLink: o.targetLink,
    notes: o.notes,
    status: o.status,
    startedCount: o.startedCount,
    remainsCount: o.remainsCount,
    completedCount: o.completedCount,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }));
  return NextResponse.json({ orders: out });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  // Maintenance mode check — admins can still order (for testing)
  const { isMaintenanceMode, getSetting } = await import("@/lib/settings");
  if (await isMaintenanceMode()) {
    if (session.user.role !== "ADMIN") {
      const msg = await getSetting("site.maintenanceMessage");
      return NextResponse.json(
        { error: "MAINTENANCE_MODE", message: msg },
        { status: 503 }
      );
    }
  }
  let body: z.infer<typeof CreateOrder>;
  try {
    body = CreateOrder.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: e?.errors ?? e?.message },
      { status: 400 }
    );
  }

  // Load tier + service
  const tier = await db.serviceTier.findUnique({
    where: { id: body.serviceTierId },
    include: { service: true },
  });
  if (!tier || !tier.isActive || !tier.service.isActive) {
    return NextResponse.json({ error: "TIER_NOT_FOUND" }, { status: 404 });
  }
  if (body.quantity < tier.minQuantity || body.quantity > tier.maxQuantity) {
    return NextResponse.json(
      {
        error: "QUANTITY_OUT_OF_RANGE",
        min: tier.minQuantity,
        max: tier.maxQuantity,
      },
      { status: 400 }
    );
  }
  if (!linkMatchesPlatform(body.targetLink, tier.service.platform)) {
    return NextResponse.json(
      { error: "LINK_MISMATCH", platform: tier.service.platform },
      { status: 400 }
    );
  }

  // Compute gross total price (TOMAN integer). Round to nearest integer.
  const grossAmount = Math.round(
    (body.quantity / 1000) * tier.pricePer1000
  );

  // Apply promo code if provided (validate but don't redeem yet — redeem
  // happens after order creation so we have an orderId to lock to).
  let discountAmount = 0;
  let promoCode: string | null = null;
  if (body.promoCode && body.promoCode.trim()) {
    const { validatePromo } = await import("@/lib/promo");
    const v = await validatePromo(body.promoCode, {
      userId: session.user.id,
      amount: grossAmount,
      platform: tier.service.platform,
      serviceSlug: tier.service.slug,
    });
    if (!v.ok) {
      return NextResponse.json(
        { error: "PROMO_INVALID", message: v.message ?? "کد تخفیف نامعتبر است." },
        { status: 400 }
      );
    }
    discountAmount = v.discountAmount ?? 0;
    promoCode = v.code ?? null;
  }
  const totalAmount = grossAmount - discountAmount;

  // Snapshot the service/tier info at purchase time
  const order = await db.order.create({
    data: {
      code: generateOrderCode(),
      userId: session.user.id,
      serviceName: tier.service.name,
      serviceSlug: tier.service.slug,
      platform: tier.service.platform,
      category: tier.service.category,
      tier: tier.tier,
      tierDisplay: tier.displayName,
      emoji: tier.service.emoji,
      quantity: body.quantity,
      unitPricePer1000: tier.pricePer1000,
      totalAmount,
      discountAmount,
      promoCode,
      targetLink: body.targetLink,
      notes: body.notes || null,
      status: "PENDING",
      acceptedTerms: body.acceptedTerms,
    },
  });

  // Lock the promo redemption to this order (idempotent).
  if (promoCode && discountAmount > 0) {
    const { redeemPromo } = await import("@/lib/promo");
    await redeemPromo(promoCode, {
      userId: session.user.id,
      orderId: order.id,
      amount: grossAmount,
      platform: tier.service.platform,
      serviceSlug: tier.service.slug,
    });
  }

  await db.orderEvent.create({
    data: {
      orderId: order.id,
      userId: session.user.id,
      status: "PENDING",
      message: discountAmount > 0
        ? `سفارش ثبت شد. در انتظار پرداخت. (تخفیف ${discountAmount.toLocaleString("fa-IR")} تومان با کد ${promoCode})`
        : "سفارش ثبت شد. در انتظار پرداخت.",
    },
  });

  // If pay=true, attempt wallet payment immediately
  if (body.pay) {
    await ensureWallet(session.user.id);
    try {
      const result = await payOrderFromWallet({
        userId: session.user.id,
        orderId: order.id,
        amount: totalAmount,
        description: `پرداخت سفارش ${order.code}`,
      });
      if (!result.alreadyPaid) {
        await db.order.update({
          where: { id: order.id },
          data: { status: "PAYMENT_CONFIRMED" },
        });
        await db.orderEvent.create({
          data: {
            orderId: order.id,
            userId: session.user.id,
            status: "PAYMENT_CONFIRMED",
            message: "پرداخت از کیف پول تأیید شد. سفارش به صف ارسال منتقل شد.",
          },
        });
      }
    } catch (e: any) {
      if (e?.message === "INSUFFICIENT_FUNDS") {
        return NextResponse.json(
          {
            orderId: order.id,
            code: order.code,
            status: "PENDING",
            error: "INSUFFICIENT_FUNDS",
            message:
              "موجودی کیف پول کافی نیست. سفارش ثبت شد — برای تکمیل، کیف پول را شارژ کنید.",
          },
          { status: 402 }
        );
      }
      throw e;
    }
  }

  const fresh = await db.order.findUnique({ where: { id: order.id } });
  return NextResponse.json({
    order: {
      id: order.id,
      code: order.code,
      status: fresh?.status ?? "PENDING",
      totalAmount,
      grossAmount,
      discountAmount,
      promoCode,
    },
  });
}
