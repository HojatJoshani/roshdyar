import { db } from "@/lib/db";

/**
 * One-off seed for demo promo codes. Safe to run multiple times.
 * Codes created:
 *   WELCOME10   — 10% off, all platforms, max 1000 uses, 1 per user
 *   ROShD20     — 20% off Instagram, max 100 uses, 1 per user
 *   FIXED5K     — 5000 Toman off, min order 30000, all platforms
 *   EXPIRED99   — 99% off but expired (for testing the expired case)
 */
const CODES = [
  {
    code: "WELCOME10",
    description: "تخفیف ۱۰٪ خوش‌آمدگویی — قابل استفاده برای همه سرویس‌ها",
    type: "PERCENT",
    value: 10,
    appliesTo: "ALL",
    maxUses: 1000,
    perUserLimit: 1,
    minOrderAmount: 0,
  },
  {
    code: "ROSHD20",
    description: "تخفیف ۲۰٪ ویژه سرویس‌های اینستاگرام",
    type: "PERCENT",
    value: 20,
    appliesTo: "INSTAGRAM",
    maxUses: 100,
    perUserLimit: 1,
    minOrderAmount: 0,
  },
  {
    code: "FIXED5K",
    description: "۵٬۰۰۰ تومان تخفیف ثابت — برای سفارش‌های بالای ۳۰٬۰۰۰ تومان",
    type: "FIXED",
    value: 5000,
    appliesTo: "ALL",
    maxUses: 0,
    perUserLimit: 0,
    minOrderAmount: 30000,
  },
  {
    code: "EXPIRED99",
    description: "کد منقضی‌شده برای تست",
    type: "PERCENT",
    value: 99,
    appliesTo: "ALL",
    maxUses: 100,
    perUserLimit: 1,
    minOrderAmount: 0,
    expiresAt: new Date(Date.now() - 86400 * 1000), // expired yesterday
  },
];

async function main() {
  for (const c of CODES) {
    const existing = await db.promoCode.findUnique({ where: { code: c.code } });
    if (!existing) {
      await db.promoCode.create({ data: c });
      console.log("created", c.code);
    } else {
      await db.promoCode.update({
        where: { code: c.code },
        data: { ...c, expiresAt: c.expiresAt ?? null },
      });
      console.log("updated", c.code);
    }
  }
  console.log("done");
}

main().catch(console.error).finally(() => db.$disconnect());
