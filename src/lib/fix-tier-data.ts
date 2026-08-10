import { db } from "@/lib/db";

/**
 * One-off fix: ensure tier deliveryEstimate values match the intended seed data.
 * Safe to run multiple times.
 */
const FIXES: Record<string, { tier: string; deliveryEstimate: string; refillPolicy: string; refundPolicy: string; tagline: string }[]> = {
  "instagram-followers": [
    { tier: "ECONOMY", deliveryEstimate: "۱ تا ۶ ساعت", refillPolicy: "بدون گارانتی ری‌فیل", refundPolicy: "بازگشت وجه فقط در صورت عدم شروع سفارش", tagline: "نرخ پایه، مناسب آزمایش" },
    { tier: "STANDARD", deliveryEstimate: "۳۰ دقیقه تا ۳ ساعت", refillPolicy: "گارانتی ری‌فیل ۳۰ روزه", refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۸۰٪", tagline: "کیفیت متعادل با قیمت منصفانه" },
    { tier: "PREMIUM", deliveryEstimate: "۱ تا ۸ ساعت", refillPolicy: "گارانتی ری‌فیل ۹۰ روزه", refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۹۰٪", tagline: "بالاترین کیفیت، افت بسیار پایین" },
  ],
  "instagram-likes": [
    { tier: "ECONOMY", deliveryEstimate: "۱۵ دقیقه تا ۲ ساعت", refillPolicy: "بدون گارانتی ری‌فیل", refundPolicy: "بازگشت وجه در صورت عدم تحویل", tagline: "لایک سریع، افت معمول" },
    { tier: "STANDARD", deliveryEstimate: "۱۰ دقیقه تا ۱ ساعت", refillPolicy: "گارانتی ری‌فیل ۳۰ روزه", refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۸۰٪", tagline: "لایک پایدار با ری‌فیل" },
    { tier: "PREMIUM", deliveryEstimate: "۵ تا ۳۰ دقیقه", refillPolicy: "گارانتی ری‌فیل ۶۰ روزه", refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۹۰٪", tagline: "لایک با کیفیت فوق‌العاده" },
  ],
  "instagram-views": [
    { tier: "ECONOMY", deliveryEstimate: "۵ دقیقه تا ۲ ساعت", refillPolicy: "بدون گارانتی (بازدید افت نمی‌کند)", refundPolicy: "بازگشت وجه در صورت عدم تحویل", tagline: "بازدید پایه" },
    { tier: "STANDARD", deliveryEstimate: "۱ تا ۳۰ دقیقه", refillPolicy: "بدون گارانتی", refundPolicy: "بازگشت وجه در صورت عدم تحویل", tagline: "بازدید سریع" },
    { tier: "PREMIUM", deliveryEstimate: "۳۰ ثانیه تا ۱۰ دقیقه", refillPolicy: "بدون گارانتی", refundPolicy: "بازگشت وجه در صورت عدم تحویل", tagline: "بازدید فوری و حجم بالا" },
  ],
  "youtube-views": [
    { tier: "ECONOMY", deliveryEstimate: "۱ تا ۱۲ ساعت", refillPolicy: "بدون گارانتی", refundPolicy: "بازگشت وجه در صورت عدم تحویل", tagline: "بازدید پایه" },
    { tier: "STANDARD", deliveryEstimate: "۳۰ دقیقه تا ۶ ساعت", refillPolicy: "بدون گارانتی", refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۸۰٪", tagline: "بازدید پایدار" },
    { tier: "PREMIUM", deliveryEstimate: "۲ تا ۸ ساعت", refillPolicy: "بدون گارانتی", refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۹۰٪", tagline: "بازدید فوق‌العاده پایدار" },
  ],
};

async function main() {
  for (const [slug, fixes] of Object.entries(FIXES)) {
    const svc = await db.service.findUnique({ where: { slug } });
    if (!svc) continue;
    for (const f of fixes) {
      await db.serviceTier.updateMany({
        where: { serviceId: svc.id, tier: f.tier },
        data: {
          deliveryEstimate: f.deliveryEstimate,
          refillPolicy: f.refillPolicy,
          refundPolicy: f.refundPolicy,
          tagline: f.tagline,
        },
      });
      console.log(`fixed ${slug} ${f.tier}`);
    }
  }
  console.log("done");
}

main().catch(console.error).finally(() => db.$disconnect());
