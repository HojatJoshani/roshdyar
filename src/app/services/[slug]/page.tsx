import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteShell } from "@/components/brand/site-shell";
import { ServiceBreadcrumb } from "@/components/brand/service-breadcrumb";
import { OrderConfigCard, type OrderTier } from "@/components/brand/order-config-card";
import { TierBadge } from "@/components/brand/tier-badge";
import { db } from "@/lib/db";
import {
  PLATFORM_META,
  CATEGORY_META,
  TIER_META,
  type Tier,
  type Platform,
  type Category,
} from "@/lib/constants";
import { formatToman, formatQuantity } from "@/lib/format";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  MinusCircle,
  PlusCircle,
  Clock,
  ArrowLeft,
  ShieldAlert,
  Info,
  Sparkles,
  Star,
} from "lucide-react";
import { ReviewsSection } from "@/components/brand/reviews-section";
import { StarRating } from "@/components/brand/star-rating";
import { TierComparisonTable } from "@/components/brand/tier-comparison-table";
import { LiveViewersBadge } from "@/components/brand/live-viewers-badge";
import { toFaDigits } from "@/lib/format";

export const dynamic = "force-dynamic";

interface FaqItem {
  q: string;
  a: string;
}

function getServiceFaqs(category: string, platform: string): FaqItem[] {
  if (platform === "INSTAGRAM" && category === "FOLLOWERS") {
    return [
      {
        q: "آیا فالوورها واقعی هستند؟",
        a: "بله، فالوورهای ارائه‌شده از حساب‌های واقعی تأمین می‌شوند. در سطح حرفه‌ای افت بسیار پایین (زیر ۲٪) و در سطح اقتصادی افت تا حدود ۲۰٪ طبیعی است که در صفحه سرویس به‌صورت شفاف درج شده است.",
      },
      {
        q: "آیا برای دریافت فالوور به رمز عبور من نیاز دارید؟",
        a: "خیر. ما هرگز رمز عبور شما را نخواهیم کرد. کافی است حساب شما عمومی باشد و لینک پیج را در زمان سفارش وارد کنید.",
      },
      {
        q: "چقدر طول می‌کشد تا سفارش شروع و تکمیل شود؟",
        a: "بسته به سطح انتخابی، شروع سفارش بین ۳۰ دقیقه تا ۱ ساعت طول می‌کشد و تحویل به‌صورت تدریجی انجام می‌شود تا الگوریتم اینستاگرام مشکوک نشود. زمان تقریبی هر سطح در کارت سفارش درج شده است.",
      },
      {
        q: "اگر پیج من خصوصی باشد چه؟",
        a: "باید حساب خود را موقتاً به حالت عمومی تغییر دهید تا سفارش اجرا شود. پس از تکمیل سفارش می‌توانید دوباره به حالت خصوصی برگردانید.",
      },
      {
        q: "در صورت افت فالوورها چه کار باید کرد؟",
        a: "در سطوح استاندارد و حرفه‌ای، ری‌فیل (جبران افت) شامل شما می‌شود. کافی است در پنل کاربری سفارش مربوطه را باز کرده و درخواست ری‌فیل بدهید یا با پشتیبانی تماس بگیرید.",
      },
    ];
  }
  if (platform === "INSTAGRAM" && category === "LIKES") {
    return [
      {
        q: "روی چه نوع پست‌هایی لایک دریافت می‌کنم؟",
        a: "روی هر پست عمومی اینستاگرام اعم از عکس، ویدیو، رییلز و کاروسل. کافی است لینک مستقیم همان پست را در زمان سفارش وارد کنید.",
      },
      {
        q: "آیا لایک‌ها دائمی هستند؟",
        a: "لایک‌ها معمولاً دائمی هستند. در سطح اقتصادی افت تا ۱۵٪ ممکن است رخ دهد، اما در سطح حرفه‌ای افت زیر ۱٪ است و گارانتی ری‌فیل ۶۰ روزه شامل می‌شود.",
      },
      {
        q: "چند لایک باید سفارش بدهم؟",
        a: "برای پست‌های تبلیغاتی، حداقل ۵۰۰ تا ۱٬۰۰۰ لایک توصیه می‌شود. برای پست‌های معمولی، ۱۰۰ تا ۵۰۰ لایک کافی است. می‌توانید از گام‌های ۵۰تایی استفاده کنید.",
      },
      {
        q: "آیا لایک‌ها از ایران هستند؟",
        a: "خیر، لایک‌ها از ترکیبی بین‌المللی تأمین می‌شوند تا الگوریتم اینستاگرام به‌طور طبیعی تعامل را ثبت کند. اگر به بازدید منطقه‌ای خاص نیاز دارید، با پشتیبانی هماهنگ کنید.",
      },
      {
        q: "اگر پست قبل از تکمیل سفارش حذف شود چه؟",
        a: "در این صورت سفارش به‌صورت خودکار متوقف و مبلغ باقی‌مانده به کیف پول شما بازمی‌گردد. هیچ اقدام دیگری لازم نیست.",
      },
    ];
  }
  if (platform === "INSTAGRAM" && category === "VIEWS") {
    return [
      {
        q: "بازدید روی رییلز هم کار می‌کند؟",
        a: "بله، این سرویس روی ویدیوهای پست، IGTV و رییلز کار می‌کند. فقط لینک مستقیم ویدیو را وارد کنید.",
      },
      {
        q: "آیا بازدیدها افت پیدا می‌کنند؟",
        a: "خیر، بازدیدها دائمی هستند و افت ندارند. این ویژگی مشترک همه سطوح این سرویس است.",
      },
      {
        q: "چقدر طول می‌کشد؟",
        a: "در سطح حرفه‌ای، تحویل از ۳۰ ثانیه آغاز می‌شود. در سطح اقتصادی، بین ۵ دقیقه تا ۲ ساعت طول می‌کشد.",
      },
      {
        q: "آیا بازدید به ورود به اکسپلور کمک می‌کند؟",
        a: "بله، افزایش بازدید یکی از مهم‌ترین فاکتورها برای ورود به اکسپلور اینستاگرام است. توصیه می‌کنیم همراه با بازدید، لایک نیز سفارش دهید تا تعامل طبیعی‌تر به نظر برسد.",
      },
      {
        q: "حداکثر چقدر می‌توانم سفارش بدهم؟",
        a: "تا یک میلیون بازدید در یک سفارش قابل ثبت است. برای حجم بالاتر با پشتیبانی تماس بگیرید تا سفارش شما را به‌صورت دسته‌بندی شده اجرا کنیم.",
      },
    ];
  }
  if (platform === "YOUTUBE" && category === "VIEWS") {
    return [
      {
        q: "بازدیدها از چه کشورهایی هستند؟",
        a: "ترکیبی بین‌المللی هستند. اگر به بازدید منطقه‌ای خاص نیاز دارید، با پشتیبانی هماهنگ کنید تا بهترین گزینه را به شما پیشنهاد دهیم.",
      },
      {
        q: "ریتنشن (مدت زمان مشاهده) چقدر است؟",
        a: "در سطح حرفه‌ای، ریتنشن متوسط حدود یک دقیقه است که برای الگوریتم یوتیوب مطلوب محسوب می‌شود. در سطوح پایین‌تر، ریتنشن حدود ۳۰ ثانیه است.",
      },
      {
        q: "آیا روی ویدیوهای کوتاه (Shorts) هم کار می‌کند؟",
        a: "بله، این سرویس روی ویدیوهای بلند و ویدیوهای کوتاه (Shorts) کار می‌کند. فقط لینک مستقیم ویدیو را در زمان سفارش وارد کنید.",
      },
      {
        q: "چقدر طول می‌کشد تا تکمیل شود؟",
        a: "بسته به حجم سفارش و سطح انتخابی، بین ۳۰ دقیقه تا ۱۲ ساعت. سفارش‌های حجیم‌تر زمان بیشتری نیاز دارند تا به‌صورت تدریجی و طبیعی اجرا شوند.",
      },
      {
        q: "آیا افت پیدا می‌کنند؟",
        a: "در سطح اقتصادی افت تا ۱۰٪ طبیعی است. در سطح حرفه‌ای، افت بسیار کم (زیر ۵٪) و ریتنشن بالاتر است. در صورت افت بیشتر از حد اعلام‌شده، با پشتیبانی در ارتباط باشید.",
      },
    ];
  }
  return [
    {
      q: "این سرویس چگونه کار می‌کند؟",
      a: "بعد از انتخاب سطح کیفی، تعداد و لینک هدف، سفارش در پنل ثبت می‌شود. ما سفارش را به تأمین‌کننده ارسال کرده و شما می‌توانید پیشرفت را قدم‌به‌قدم در صفحه رهگیری ببینید.",
    },
    {
      q: "آیا برای استفاده به رمز عبور نیاز دارید؟",
      a: "خیر. ما هرگز رمز عبور حساب شما را نخواهیم کرد. فقط لینک عمومی هدف را در زمان سفارش وارد می‌کنید.",
    },
    {
      q: "اگر سفارش کامل اجرا نشد چه می‌شود؟",
      a: "در صورت عدم تحویل حداقل میزان تعیین‌شده (بسته به سطح)، مبلغ باقی‌مانده به‌طور خودکار به کیف پول شما بازمی‌گردد.",
    },
    {
      q: "چگونه می‌توانم با پشتیبانی تماس بگیرم؟",
      a: "از طریق صفحه پشتیبانی در پنل کاربری می‌توانید تیکت ثبت کنید. تیم پشتیبانی در سریع‌ترین زمان پاسخ می‌دهد.",
    },
  ];
}

async function getService(slug: string) {
  const s = await db.service.findUnique({
    where: { slug },
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: [{ tier: "asc" }],
      },
    },
  });
  if (!s || !s.isActive) return null;
  // Strip provider-only fields explicitly — these must never reach the client.
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    platform: s.platform,
    category: s.category,
    summary: s.summary,
    description: s.description,
    suitableFor: s.suitableFor,
    emoji: s.emoji,
    sortOrder: s.sortOrder,
    tiers: s.tiers.map<OrderTier>((t) => ({
      id: t.id,
      tier: t.tier,
      displayName: t.displayName,
      tagline: t.tagline,
      features: t.featuresCsv
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      pricePer1000: t.pricePer1000,
      minQuantity: t.minQuantity,
      maxQuantity: t.maxQuantity,
      step: t.step,
      deliveryEstimate: t.deliveryEstimate,
      refillPolicy: t.refillPolicy,
      refundPolicy: t.refundPolicy,
    })),
  };
}

async function getReviewStats(serviceId: string) {
  const reviews = await db.serviceReview.findMany({
    where: { serviceId, isHidden: false },
    select: { rating: true },
  });
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { count, average: Math.round(avg * 10) / 10 };
}

async function getRelatedServices(currentSlug: string, platform: string) {
  const services = await db.service.findMany({
    where: {
      isActive: true,
      platform,
      slug: { not: currentSlug },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 3,
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: [{ tier: "asc" }],
        take: 1,
      },
    },
  });
  return services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    platform: s.platform,
    category: s.category,
    summary: s.summary,
    emoji: s.emoji,
    priceFrom: s.tiers.length > 0
      ? Math.min(...s.tiers.map((t) => t.pricePer1000))
      : null,
  }));
}

export default async function ServiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const service = await getService(slug);
  if (!service) notFound();

  const reviewStats = await getReviewStats(service.id);

  // Fetch related services (same platform, different slug) for cross-sell
  const relatedServices = await getRelatedServices(service.slug, service.platform);

  const platformMeta = PLATFORM_META[service.platform as Platform];
  const categoryMeta = CATEGORY_META[service.category as Category];

  // Reference tier for the Overview quick facts (Standard by default)
  const referenceTier =
    service.tiers.find((t) => t.tier === "STANDARD") ?? service.tiers[0];

  const suitableForList = service.suitableFor
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const faqs = getServiceFaqs(service.category, service.platform);

  const platformHref =
    service.platform === "INSTAGRAM" ? "/services/instagram" : "/services/youtube";

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-8 md:py-10">
        {/* Breadcrumb */}
        <ServiceBreadcrumb
          items={[
            { label: "خانه", href: "/" },
            { label: "خدمات", href: platformHref },
            { label: platformMeta.label, href: platformHref },
            { label: service.name },
          ]}
          className="mb-6"
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
          {/* ============ LEFT COLUMN ============ */}
          <div className="space-y-8">
            {/* Service header */}
            <header>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-3xl shadow-soft sm:h-20 sm:w-20 sm:text-4xl">
                  {service.emoji}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        color: platformMeta.color,
                        borderColor: `${platformMeta.color}30`,
                        backgroundColor: `${platformMeta.color}0d`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: platformMeta.color }}
                      />
                      {platformMeta.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-[11px] text-muted-foreground">
                      {categoryMeta.emoji} {categoryMeta.label}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {service.name}
                  </h1>
                  <p className="mt-3 text-base leading-8 text-muted-foreground">
                    {service.summary}
                  </p>
                  {/* Rating badge — only when reviews exist */}
                  {reviewStats.count > 0 && (
                    <a
                      href="?tab=reviews"
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/[0.04] px-3 py-1 text-xs transition-colors hover:border-amber-500/40 hover:bg-amber-500/[0.08]"
                    >
                      <StarRating rating={reviewStats.average} size={13} />
                      <span className="tnum font-semibold tabular-nums text-foreground">
                        {toFaDigits(reviewStats.average.toFixed(1))}
                      </span>
                      <span className="text-muted-foreground">
                        ({toFaDigits(reviewStats.count)} نظر)
                      </span>
                    </a>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {service.tiers.map((t) => (
                      <TierBadge key={t.id} tier={t.tier as Tier} size="sm" />
                    ))}
                  </div>
                  <div className="mt-3">
                    <LiveViewersBadge slug={service.slug} />
                  </div>
                </div>
              </div>
            </header>

            {/* Tabs */}
            <Tabs defaultValue={sp.tab === "reviews" ? "reviews" : "overview"} className="w-full">
              <TabsList className="h-auto flex-wrap bg-muted/60 p-1">
                <TabsTrigger value="overview" className="gap-1.5 rounded-md px-4 py-2 text-sm">
                  <Info className="h-3.5 w-3.5" />
                  نمای کلی
                </TabsTrigger>
                <TabsTrigger value="terms" className="gap-1.5 rounded-md px-4 py-2 text-sm">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  شرایط و قوانین
                </TabsTrigger>
                <TabsTrigger value="faq" className="gap-1.5 rounded-md px-4 py-2 text-sm">
                  سؤالات رایج
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-1.5 rounded-md px-4 py-2 text-sm">
                  <Star className="h-3.5 w-3.5" />
                  نظرات
                </TabsTrigger>
              </TabsList>

              {/* ============ Overview ============ */}
              <TabsContent value="overview" className="mt-5">
                <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
                  <h2 className="mb-3 text-lg font-semibold text-foreground">
                    درباره این سرویس
                  </h2>
                  <p className="text-base leading-9 text-muted-foreground">
                    {service.description}
                  </p>

                  {suitableForList.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-2.5 text-xs font-medium text-muted-foreground">
                        مناسب برای
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {suitableForList.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1.5 rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground"
                          >
                            <Check className="h-3 w-3 text-primary" />
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick facts grid */}
                  <div className="mt-6">
                    <h3 className="mb-3 text-xs font-medium text-muted-foreground">
                      مشخصات سفارش
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <FactCard
                        icon={<MinusCircle className="h-3.5 w-3.5" />}
                        label="حداقل سفارش"
                        value={formatQuantity(referenceTier.minQuantity)}
                      />
                      <FactCard
                        icon={<PlusCircle className="h-3.5 w-3.5" />}
                        label="حداکثر سفارش"
                        value={formatQuantity(referenceTier.maxQuantity)}
                      />
                      <FactCard
                        icon={<Clock className="h-3.5 w-3.5" />}
                        label="زمان تحویل"
                        value={referenceTier.deliveryEstimate}
                      />
                      <FactCard
                        icon={<Sparkles className="h-3.5 w-3.5" />}
                        label="شروع قیمت / ۱۰۰۰"
                        value={`${formatToman(referenceTier.pricePer1000)} ت`}
                      />
                    </div>
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      * نمایش بر اساس سطح{" "}
                      <span className="font-medium text-foreground">
                        {TIER_META[referenceTier.tier as Tier].label}
                      </span>
                      . برای مشاهدهٔ سایر سطوح، از کارت سفارش استفاده کنید.
                    </p>
                  </div>

                  {/* Tier comparison table */}
                  <div className="mt-8">
                    <h3 className="mb-3 text-xs font-medium text-muted-foreground">
                      مقایسهٔ سطوح کیفی
                    </h3>
                    <TierComparisonTable tiers={service.tiers} />
                  </div>
                </div>
              </TabsContent>

              {/* ============ Terms ============ */}
              <TabsContent value="terms" className="mt-5">
                <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-semibold text-foreground">
                    سیاست هر سطح کیفی
                  </h2>
                  <div className="space-y-4">
                    {service.tiers.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-xl border border-border/60 bg-background/60 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <TierBadge tier={t.tier as Tier} size="sm" />
                            <span className="text-sm font-medium text-foreground">
                              {t.displayName}
                            </span>
                          </div>
                          <span className="tnum text-sm font-bold tabular-nums text-foreground">
                            {formatToman(t.pricePer1000)}{" "}
                            <span className="text-[10px] font-normal text-muted-foreground">
                              ت / ۱٬۰۰۰
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-muted/40 p-3">
                            <div className="mb-1 text-[11px] font-medium text-muted-foreground">
                              سیاست ری‌فیل
                            </div>
                            <p className="text-xs leading-5 text-foreground">
                              {t.refillPolicy}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-3">
                            <div className="mb-1 text-[11px] font-medium text-muted-foreground">
                              سیاست بازگشت وجه
                            </div>
                            <p className="text-xs leading-5 text-foreground">
                              {t.refundPolicy}
                            </p>
                          </div>
                        </div>

                        {t.features.length > 0 && (
                          <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            {t.features.map((f) => (
                              <li
                                key={f}
                                className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
                              >
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span className="text-foreground">{f}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Accept terms callout */}
                  <div className="mt-5 rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          تأیید قوانین سرویس
                        </h3>
                        <p className="mt-1 text-xs leading-6 text-muted-foreground">
                          با ثبت سفارش، شما تأیید می‌کنید که قوانین سرویس شامل
                          رعایت حداقل و حداکثر تعداد، ارائه لینک صحیح و عمومی
                          بودن حساب، و سیاست‌های ری‌فیل و بازگشت وجه هر سطح را
                          مطالعه و پذیرفته‌اید. در صورت نقض قوانین، مسئولیت عواقب
                          احتمالی بر عهده خریدار است. رشدیار متعهد می‌شود مبلغ
                          سفارش‌های ناتمام را طبق سیاست بازگشت وجه به کیف پول شما
                          بازگرداند.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ============ FAQ ============ */}
              <TabsContent value="faq" className="mt-5">
                <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-semibold text-foreground">
                    سؤالات رایج درباره {service.name}
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((f, i) => (
                      <AccordionItem key={i} value={`item-${i}`}>
                        <AccordionTrigger className="text-right text-sm font-medium text-foreground hover:no-underline">
                          {f.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-right text-sm leading-8 text-muted-foreground">
                          {f.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </TabsContent>

              {/* ============ Reviews ============ */}
              <TabsContent value="reviews" className="mt-5">
                <ReviewsSection serviceSlug={service.slug} />
              </TabsContent>
            </Tabs>

            {/* Mobile CTA — small "go to order" hint that scrolls down to the order card */}
            <div className="lg:hidden">
              <Link
                href="#order"
                className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                تنظیمات سفارش را در پایین صفحه پر کنید
                <ArrowLeft className="h-4 w-4 rtl-flip" />
              </Link>
            </div>
          </div>

          {/* ============ RIGHT COLUMN (sticky on desktop) ============ */}
          <aside
            id="order"
            className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
          >
            <OrderConfigCard
              serviceName={service.name}
              platform={service.platform}
              tiers={service.tiers}
            />
          </aside>
        </div>

        {/* Related services cross-sell */}
        {relatedServices.length > 0 && (
          <div className="mt-12 border-t border-border/60 pt-10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  سرویس‌های مرتبط
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  سرویس‌های دیگر {platformMeta.label} که ممکن است به‌دردتان بخورد
                </p>
              </div>
              <Link
                href={platformHref}
                className="hidden items-center gap-1 text-xs font-medium text-primary hover:underline sm:inline-flex"
              >
                همه سرویس‌های {platformMeta.label}
                <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedServices.map((s) => {
                const catMeta = CATEGORY_META[s.category as Category];
                return (
                  <Link
                    key={s.id}
                    href={`/services/${s.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-xl">
                      {s.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {s.name}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {s.summary}
                      </p>
                      {s.priceFrom !== null && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          از{" "}
                          <span className="tnum font-medium tabular-nums text-foreground">
                            {formatToman(s.priceFrom)}
                          </span>{" "}
                          ت / ۱۰۰۰
                        </p>
                      )}
                    </div>
                    <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary rtl-flip" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}

function FactCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-3">
      <div className="mb-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="tnum text-sm font-semibold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
