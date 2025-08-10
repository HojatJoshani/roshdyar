import { db } from "@/lib/db";

/**
 * Promo code validation + redemption service.
 *
 * Flow:
 *   validate(code, {userId, amount, platform, serviceSlug}) — checks the code
 *     is active, not expired, under maxUses, under perUserLimit, above
 *     minOrderAmount, and appliesTo matches. Returns the discount amount
 *     without committing any redemption.
 *   redeem(code, {userId, orderId, amount, ...}) — atomically increments
 *     usedCount + creates a PromoRedemption row (idempotent on orderId).
 */

export interface PromoContext {
  userId: string;
  amount: number; // order total before discount
  platform?: string;
  serviceSlug?: string;
}

export interface PromoValidation {
  ok: boolean;
  error?:
    | "NOT_FOUND"
    | "INACTIVE"
    | "EXPIRED"
    | "MAX_USES"
    | "PER_USER_LIMIT"
    | "MIN_AMOUNT"
    | "NOT_APPLICABLE";
  message?: string;
  discountAmount?: number;
  code?: string;
  description?: string;
  type?: string;
  value?: number;
}

function matchesAppliesTo(appliesTo: string, ctx: PromoContext): boolean {
  if (!appliesTo || appliesTo === "ALL") return true;
  // Try matching against platform (INSTAGRAM/YOUTUBE)
  if (ctx.platform && appliesTo === ctx.platform) return true;
  // Try matching against service slug
  if (ctx.serviceSlug && appliesTo === ctx.serviceSlug) return true;
  return false;
}

export async function validatePromo(
  code: string,
  ctx: PromoContext
): Promise<PromoValidation> {
  const upper = code.trim().toUpperCase();
  if (!upper) return { ok: false, error: "NOT_FOUND" };

  const promo = await db.promoCode.findUnique({
    where: { code: upper },
    include: {
      redemptions: {
        where: { userId: ctx.userId },
      },
    },
  });
  if (!promo) return { ok: false, error: "NOT_FOUND", message: "کد یافت نشد." };
  if (!promo.isActive)
    return { ok: false, error: "INACTIVE", message: "این کد غیرفعال است." };
  if (promo.expiresAt && promo.expiresAt < new Date())
    return { ok: false, error: "EXPIRED", message: "این کد منقضی شده است." };
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses)
    return {
      ok: false,
      error: "MAX_USES",
      message: "ظرفیت استفاده از این کد به‌پایان رسیده است.",
    };
  if (promo.perUserLimit > 0) {
    // Count only finalized redemptions (with orderId) for per-user limit
    const usedByUser = promo.redemptions.filter((r) => r.orderId).length;
    if (usedByUser >= promo.perUserLimit)
      return {
        ok: false,
        error: "PER_USER_LIMIT",
        message: `این کد فقط ${promo.perUserLimit} بار برای هر کاربر قابل استفاده است.`,
      };
  }
  if (promo.minOrderAmount > 0 && ctx.amount < promo.minOrderAmount)
    return {
      ok: false,
      error: "MIN_AMOUNT",
      message: `حداقل مبلغ سفارش برای این کد ${promo.minOrderAmount.toLocaleString("fa-IR")} تومان است.`,
    };
  if (!matchesAppliesTo(promo.appliesTo, ctx))
    return {
      ok: false,
      error: "NOT_APPLICABLE",
      message: "این کد برای سرویس انتخابی شما قابل اعمال نیست.",
    };

  // Compute discount
  let discount = 0;
  if (promo.type === "PERCENT") {
    discount = Math.round((ctx.amount * promo.value) / 100);
  } else if (promo.type === "FIXED") {
    discount = promo.value;
  }
  // Cap discount at order total
  discount = Math.min(discount, ctx.amount);

  return {
    ok: true,
    discountAmount: discount,
    code: promo.code,
    description: promo.description ?? undefined,
    type: promo.type,
    value: promo.value,
  };
}

export async function redeemPromo(
  code: string,
  ctx: PromoContext & { orderId: string }
): Promise<PromoValidation> {
  const validation = await validatePromo(code, ctx);
  if (!validation.ok || validation.discountAmount == null) return validation;

  const upper = code.trim().toUpperCase();
  const promo = await db.promoCode.findUnique({
    where: { code: upper },
    include: {
      redemptions: {
        where: { userId: ctx.userId, orderId: ctx.orderId },
      },
    },
  });
  if (!promo) return { ok: false, error: "NOT_FOUND" };

  // Idempotent: if a redemption already exists for this user+order+code,
  // return the existing discount.
  if (promo.redemptions.length > 0) {
    return {
      ok: true,
      discountAmount: promo.redemptions[0].discountAmount,
      code: promo.code,
      description: promo.description ?? undefined,
    };
  }

  // Atomically increment usedCount + create redemption
  await db.$transaction([
    db.promoCode.update({
      where: { id: promo.id },
      data: { usedCount: { increment: 1 } },
    }),
    db.promoRedemption.create({
      data: {
        promoCodeId: promo.id,
        userId: ctx.userId,
        orderId: ctx.orderId,
        discountAmount: validation.discountAmount,
      },
    }),
  ]);

  return validation;
}
