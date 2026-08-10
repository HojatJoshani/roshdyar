// Shared domain constants — order lifecycle, tier definitions, status labels.
// Used by both client and server.

export type OrderStatus =
  | "PENDING"
  | "PAYMENT_CONFIRMED"
  | "PROCESSING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED";

export type Tier = "ECONOMY" | "STANDARD" | "PREMIUM";

export type Platform = "INSTAGRAM" | "YOUTUBE";

export type Category =
  | "FOLLOWERS"
  | "LIKES"
  | "VIEWS"
  | "SUBSCRIBERS";

export interface StatusMeta {
  label: string;
  step: number; // for timeline ordering
  tone: "neutral" | "info" | "warning" | "success" | "danger";
  description: string;
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING: {
    label: "در انتظار پرداخت",
    step: 0,
    tone: "neutral",
    description: "سفارش ثبت شده و منتظر تأیید پرداخت است.",
  },
  PAYMENT_CONFIRMED: {
    label: "پرداخت تأیید شد",
    step: 1,
    tone: "info",
    description: "مبلغ از کیف پول کسر شد و سفارش برای ارسال به تأمین‌کننده آماده است.",
  },
  PROCESSING: {
    label: "در حال ارسال",
    step: 2,
    tone: "info",
    description: "سفارش در حال ارسال به تأمین‌کننده است.",
  },
  IN_PROGRESS: {
    label: "در حال انجام",
    step: 3,
    tone: "warning",
    description: "سفارش در حال اجرا است و به‌تدریج پیش می‌رود.",
  },
  COMPLETED: {
    label: "تکمیل شد",
    step: 4,
    tone: "success",
    description: "سفارش با موفقیت تکمیل شد.",
  },
  PARTIAL: {
    label: "ناقص انجام شد",
    step: 4,
    tone: "warning",
    description: "بخشی از سفارش انجام شد. مابه‌التفاوت به کیف پول بازگردانده می‌شود.",
  },
  FAILED: {
    label: "ناموفق",
    step: 4,
    tone: "danger",
    description: "سفارش با خطا مواجه شد. مبلغ به‌طور کامل به کیف پول بازگردانده می‌شود.",
  },
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "IN_PROGRESS",
  "COMPLETED",
];

export interface TierMeta {
  label: string;
  shortLabel: string;
  description: string;
  tone: "economy" | "standard" | "premium";
  recommended?: boolean;
}

export const TIER_META: Record<Tier, TierMeta> = {
  ECONOMY: {
    label: "اقتصادی",
    shortLabel: "Economy",
    description: "بهای پایین، کیفیت متوسط. مناسب آزمایش.",
    tone: "economy",
  },
  STANDARD: {
    label: "استاندارد",
    shortLabel: "Standard",
    description: "کیفیت بالا با قیمت منصفانه. انتخاب اکثریت کاربران.",
    tone: "standard",
    recommended: true,
  },
  PREMIUM: {
    label: "حرفه‌ای",
    shortLabel: "Premium",
    description: "بالاترین کیفیت و نرخ افت پایین. برای حساب‌های جدی.",
    tone: "premium",
  },
};

export const PLATFORM_META: Record<Platform, { label: string; emoji: string; color: string }> = {
  INSTAGRAM: { label: "اینستاگرام", emoji: "📸", color: "#E1306C" },
  YOUTUBE: { label: "یوتیوب", emoji: "▶️", color: "#FF0000" },
};

export const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  FOLLOWERS: { label: "فالوور", emoji: "👥" },
  LIKES: { label: "لایک", emoji: "❤️" },
  VIEWS: { label: "بازدید", emoji: "👁️" },
  SUBSCRIBERS: { label: "مشترک", emoji: "🔔" },
};
