import { db } from "@/lib/db";
import { hash } from "bcryptjs";

/**
 * Seed script — creates admin user + curated services with tiers.
 * Safe to run multiple times (idempotent-ish).
 *
 * Usage: bun run src/lib/seed.ts
 */

async function main() {
  // Admin user
  const adminEmail = "admin@roshdgar.local";
  const adminPass = "admin12345";
  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  let admin = existing;
  if (!admin) {
    admin = await db.user.create({
      data: {
        email: adminEmail,
        name: "مدیر سیستم",
        role: "ADMIN",
        passwordHash: await hash(adminPass, 10),
      },
    });
    console.log("Created admin:", admin.email, "password:", adminPass);
  } else {
    console.log("Admin exists:", admin.email);
  }
  await db.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, balance: 10000000 },
  });

  // Demo customer
  const demoEmail = "user@roshdgar.local";
  const demoPass = "user12345";
  let demo = await db.user.findUnique({ where: { email: demoEmail } });
  if (!demo) {
    demo = await db.user.create({
      data: {
        email: demoEmail,
        name: "کاربر نمونه",
        role: "CUSTOMER",
        passwordHash: await hash(demoPass, 10),
      },
    });
    await db.wallet.upsert({
      where: { userId: demo.id },
      update: {},
      create: { userId: demo.id, balance: 250000 },
    });
    console.log("Created demo:", demo.email, "password:", demoPass);
  } else {
    await db.wallet.upsert({
      where: { userId: demo.id },
      update: {},
      create: { userId: demo.id, balance: 250000 },
    });
    console.log("Demo exists:", demo.email);
  }

  // Services — curated, with 3 tiers each
  const services = [
    {
      slug: "instagram-followers",
      name: "فالوور اینستاگرام",
      platform: "INSTAGRAM",
      category: "FOLLOWERS",
      summary: "افزایش واقعی و پایدار فالوورهای صفحه شما",
      description:
        "فالوورهای اینستاگرام با کیفیت‌های مختلف، از پایه تا حرفه‌ای. سرعت تحویل تدریجی و افت بسیار پایین. مناسب برای رشد ارگانیک صفحه و افزایش اعتبار.",
      suitableFor: "صفحات تجاری، پیج‌های شخصی، برندها",
      emoji: "👥",
      sortOrder: 1,
      tiers: [
        {
          tier: "ECONOMY",
          displayName: "اقتصادی",
          tagline: "نرخ پایه، مناسب آزمایش",
          featuresCsv: "تحویل تدریجی,افت تا ۲۰٪ در ۳۰ روز,بدون ری‌فیل,پشتیبانی پایه",
          pricePer1000: 35000,
          minQuantity: 100,
          maxQuantity: 20000,
          step: 100,
          deliveryEstimate: "۱ تا ۶ ساعت",
          refillPolicy: "بدون گارانتی ری‌فیل",
          refundPolicy: "بازگشت وجه فقط در صورت عدم شروع سفارش",
          providerKey: "mock",
          providerServiceId: "ig-FLW-ECO",
          providerCostPer1000: 18000,
        },
        {
          tier: "STANDARD",
          displayName: "استاندارد",
          tagline: "کیفیت متعادل با قیمت منصفانه",
          featuresCsv: "تحویل تدریجی,افت کم (حدود ۵٪),ری‌فیل ۳۰ روزه,پشتیبانی اولویت‌دار",
          pricePer1000: 65000,
          minQuantity: 100,
          maxQuantity: 50000,
          step: 100,
          deliveryEstimate: "۳۰ دقیقه تا ۳ ساعت",
          refillPolicy: "گارانتی ری‌فیل ۳۰ روزه",
          refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۸۰٪",
          providerKey: "mock",
          providerServiceId: "ig-FLW-STD",
          providerCostPer1000: 38000,
        },
        {
          tier: "PREMIUM",
          displayName: "حرفه‌ای",
          tagline: "بالاترین کیفیت، افت بسیار پایین",
          featuresCsv: "تحویل تدریجی طبیعی,افت زیر ۲٪,ری‌فیل ۹۰ روزه,پشتیبانی ویژه",
          pricePer1000: 95000,
          minQuantity: 100,
          maxQuantity: 100000,
          step: 100,
          deliveryEstimate: "۱ تا ۸ ساعت",
          refillPolicy: "گارانتی ری‌فیل ۹۰ روزه",
          refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۹۰٪",
          providerKey: "mock",
          providerServiceId: "ig-FLW-PRM",
          providerCostPer1000: 62000,
        },
      ],
    },
    {
      slug: "instagram-likes",
      name: "لایک اینستاگرام",
      platform: "INSTAGRAM",
      category: "LIKES",
      summary: "لایک فوری برای پست‌های شما",
      description:
        "لایک با کیفیت بالا برای افزایش تعامل پست‌های شما. تحویل سریع و پایدار. مناسب پست‌های تبلیغاتی و تقویت الگوریتم اکسپلور.",
      suitableFor: "پست‌های تبلیغاتی، رییلز، تقویت اکسپلور",
      emoji: "❤️",
      sortOrder: 2,
      tiers: [
        {
          tier: "ECONOMY",
          displayName: "اقتصادی",
          tagline: "لایک سریع، افت معمول",
          featuresCsv: "تحویل ۱۵ دقیقه تا ۲ ساعت,افت تا ۱۵٪,بدون ری‌فیل",
          pricePer1000: 18000,
          minQuantity: 50,
          maxQuantity: 30000,
          step: 50,
          deliveryEstimate: "۱۵ دقیقه تا ۲ ساعت",
          refillPolicy: "بدون گارانتی ری‌فیل",
          refundPolicy: "بازگشت وجه در صورت عدم تحویل",
          providerKey: "mock",
          providerServiceId: "ig-LIKE-ECO",
          providerCostPer1000: 9000,
        },
        {
          tier: "STANDARD",
          displayName: "استاندارد",
          tagline: "لایک پایدار با ری‌فیل",
          featuresCsv: "تحویل ۱۰ دقیقه تا ۱ ساعت,افت کم,ری‌فیل ۳۰ روزه",
          pricePer1000: 32000,
          minQuantity: 50,
          maxQuantity: 50000,
          step: 50,
          deliveryEstimate: "۱۰ دقیقه تا ۱ ساعت",
          refillPolicy: "گارانتی ری‌فیل ۳۰ روزه",
          refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۸۰٪",
          providerKey: "mock",
          providerServiceId: "ig-LIKE-STD",
          providerCostPer1000: 18000,
        },
        {
          tier: "PREMIUM",
          displayName: "حرفه‌ای",
          tagline: "لایک با کیفیت فوق‌العاده",
          featuresCsv: "تحویل ۵ دقیقه تا ۳۰ دقیقه,افت زیر ۱٪,ری‌فیل ۶۰ روزه",
          pricePer1000: 48000,
          minQuantity: 50,
          maxQuantity: 100000,
          step: 50,
          deliveryEstimate: "۵ تا ۳۰ دقیقه",
          refillPolicy: "گارانتی ری‌فیل ۶۰ روزه",
          refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۹۰٪",
          providerKey: "mock",
          providerServiceId: "ig-LIKE-PRM",
          providerCostPer1000: 30000,
        },
      ],
    },
    {
      slug: "instagram-views",
      name: "بازدید اینستاگرام",
      platform: "INSTAGRAM",
      category: "VIEWS",
      summary: "بازدید ویدیو و رییلز",
      description:
        "افزایش سریع بازدید ویدیوها و رییلز برای تقویت الگوریتم اکسپلور. تحویل فوری و بدون افت.",
      suitableFor: "رییلز، IGTV، ویدیوهای پست",
      emoji: "👁️",
      sortOrder: 3,
      tiers: [
        {
          tier: "ECONOMY",
          displayName: "اقتصادی",
          tagline: "بازدید پایه",
          featuresCsv: "تحویل ۵ دقیقه تا ۲ ساعت,بدون افت",
          pricePer1000: 4000,
          minQuantity: 100,
          maxQuantity: 1000000,
          step: 100,
          deliveryEstimate: "۵ دقیقه تا ۲ ساعت",
          refillPolicy: "بدون گارانتی (بازدید افت نمی‌کند)",
          refundPolicy: "بازگشت وجه در صورت عدم تحویل",
          providerKey: "mock",
          providerServiceId: "ig-VIEW-ECO",
          providerCostPer1000: 1500,
        },
        {
          tier: "STANDARD",
          displayName: "استاندارد",
          tagline: "بازدید سریع",
          featuresCsv: "تحویل ۱ تا ۳۰ دقیقه,بدون افت",
          pricePer1000: 7500,
          minQuantity: 100,
          maxQuantity: 1000000,
          step: 100,
          deliveryEstimate: "۱ تا ۳۰ دقیقه",
          refillPolicy: "بدون گارانتی",
          refundPolicy: "بازگشت وجه در صورت عدم تحویل",
          providerKey: "mock",
          providerServiceId: "ig-VIEW-STD",
          providerCostPer1000: 3500,
        },
        {
          tier: "PREMIUM",
          displayName: "حرفه‌ای",
          tagline: "بازدید فوری و حجم بالا",
          featuresCsv: "تحویل ۳۰ ثانیه تا ۱۰ دقیقه,بدون افت,پشتیبانی ویژه",
          pricePer1000: 12000,
          minQuantity: 100,
          maxQuantity: 1000000,
          step: 100,
          deliveryEstimate: "۳۰ ثانیه تا ۱۰ دقیقه",
          refillPolicy: "بدون گارانتی",
          refundPolicy: "بازگشت وجه در صورت عدم تحویل",
          providerKey: "mock",
          providerServiceId: "ig-VIEW-PRM",
          providerCostPer1000: 6000,
        },
      ],
    },
    {
      slug: "youtube-views",
      name: "بازدید یوتیوب",
      platform: "YOUTUBE",
      category: "VIEWS",
      summary: "بازدید واقعی برای ویدیوهای یوتیوب",
      description:
        "افزایش بازدید ویدیوهای یوتیوب با حفظ حساب. مناسب برای تقویت رتبه ویدیو در جستجو و توصیه‌ها.",
      suitableFor: "ویدیوهای کانال یوتیوب",
      emoji: "▶️",
      sortOrder: 4,
      tiers: [
        {
          tier: "ECONOMY",
          displayName: "اقتصادی",
          tagline: "بازدید پایه",
          featuresCsv: "تحویل ۱ تا ۱۲ ساعت,افت تا ۱۰٪",
          pricePer1000: 22000,
          minQuantity: 500,
          maxQuantity: 1000000,
          step: 500,
          deliveryEstimate: "۱ تا ۱۲ ساعت",
          refillPolicy: "بدون گارانتی",
          refundPolicy: "بازگشت وجه در صورت عدم تحویل",
          providerKey: "mock",
          providerServiceId: "yt-VIEW-ECO",
          providerCostPer1000: 12000,
        },
        {
          tier: "STANDARD",
          displayName: "استاندارد",
          tagline: "بازدید پایدار",
          featuresCsv: "تحویل ۳۰ دقیقه تا ۶ ساعت,افت کم",
          pricePer1000: 38000,
          minQuantity: 500,
          maxQuantity: 1000000,
          step: 500,
          deliveryEstimate: "۳۰ دقیقه تا ۶ ساعت",
          refillPolicy: "بدون گارانتی",
          refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۸۰٪",
          providerKey: "mock",
          providerServiceId: "yt-VIEW-STD",
          providerCostPer1000: 22000,
        },
        {
          tier: "PREMIUM",
          displayName: "حرفه‌ای",
          tagline: "بازدید فوق‌العاده پایدار",
          featuresCsv: "تحویل ۲ تا ۸ ساعت,افت بسیار کم,ریتنشن بالا",
          pricePer1000: 65000,
          minQuantity: 500,
          maxQuantity: 1000000,
          step: 500,
          deliveryEstimate: "۲ تا ۸ ساعت",
          refillPolicy: "بدون گارانتی",
          refundPolicy: "بازگشت وجه در صورت عدم تحویل حداقل ۹۰٪",
          providerKey: "mock",
          providerServiceId: "yt-VIEW-PRM",
          providerCostPer1000: 42000,
        },
      ],
    },
  ];

  for (const svc of services) {
    const existing = await db.service.findUnique({ where: { slug: svc.slug } });
    if (!existing) {
      const created = await db.service.create({
        data: {
          slug: svc.slug,
          name: svc.name,
          platform: svc.platform,
          category: svc.category,
          summary: svc.summary,
          description: svc.description,
          suitableFor: svc.suitableFor,
          emoji: svc.emoji,
          sortOrder: svc.sortOrder,
          isActive: true,
          tiers: { create: svc.tiers },
        },
        include: { tiers: true },
      });
      console.log("Created service:", created.slug, "with", created.tiers.length, "tiers");
    } else {
      // Update tier prices / data
      await db.service.update({
        where: { id: existing.id },
        data: {
          name: svc.name,
          platform: svc.platform,
          category: svc.category,
          summary: svc.summary,
          description: svc.description,
          suitableFor: svc.suitableFor,
          emoji: svc.emoji,
          sortOrder: svc.sortOrder,
        },
      });
      for (const t of svc.tiers) {
        const et = await db.serviceTier.findUnique({
          where: { serviceId_tier: { serviceId: existing.id, tier: t.tier } },
        });
        if (!et) {
          await db.serviceTier.create({
            data: { serviceId: existing.id, ...t } as any,
          });
        } else {
          await db.serviceTier.update({
            where: { id: et.id },
            data: {
              displayName: t.displayName,
              tagline: t.tagline,
              featuresCsv: t.featuresCsv,
              pricePer1000: t.pricePer1000,
              minQuantity: t.minQuantity,
              maxQuantity: t.maxQuantity,
              step: t.step,
              deliveryEstimate: t.deliveryEstimate,
              refillPolicy: t.refillPolicy,
              refundPolicy: t.refundPolicy,
              providerKey: t.providerKey,
              providerServiceId: t.providerServiceId,
              providerCostPer1000: t.providerCostPer1000,
            },
          });
        }
      }
      console.log("Updated service:", svc.slug);
    }
  }

  console.log("Seed done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

