import { SiteShell } from "@/components/brand/site-shell";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Headset,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  Instagram,
  Youtube,
  Star,
} from "lucide-react";
import { ServiceCard } from "@/components/brand/service-card";
import { AnimatedCounter } from "@/components/brand/animated-counter";
import { FeaturedReviewsSection } from "@/components/brand/featured-reviews-section";
import { formatToman } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const services = await db.service.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: [{ tier: "asc" }],
      },
    },
    take: 6,
  });

  // Honest completed-order counts per service slug (for social proof)
  const orderCounts = await db.order.groupBy({
    by: ["serviceSlug"],
    where: {
      serviceSlug: { in: services.map((s) => s.slug) },
      status: "COMPLETED",
    },
    _count: { _all: true },
  });
  const countMap = new Map(
    orderCounts.map((o) => [o.serviceSlug, o._count._all])
  );

  // Strip provider-only fields for client
  return services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    platform: s.platform,
    category: s.category,
    summary: s.summary,
    emoji: s.emoji,
    completedOrderCount: countMap.get(s.slug) ?? 0,
    tiers: s.tiers.map((t) => ({
      id: t.id,
      tier: t.tier,
      displayName: t.displayName,
      tagline: t.tagline,
      pricePer1000: t.pricePer1000,
      deliveryEstimate: t.deliveryEstimate,
    })),
  }));
}

export default async function HomePage() {
  const services = await getHomeData();
  const igServices = services.filter((s) => s.platform === "INSTAGRAM");
  const ytServices = services.filter((s) => s.platform === "YOUTUBE");

  return (
    <SiteShell>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-mesh-brand">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="container relative mx-auto px-4 pb-20 pt-16 sm:pt-24 md:pb-28 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              کیفیتی که می‌فهمی — نه وعده‌های تبلیغاتی
            </div>
            <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
              رشد اینستاگرام و یوتیوب،
              <br />
              <span className="text-gradient-brand">شفاف و قابل اعتماد</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
              فالوور، لایک و بازدید با کیفیت واقعی، تحویل شفاف با رهگیری لحظه‌ای،
              گارانتی ری‌فیل و پشتیبانی صادقانه. بدون جدول‌های گیج‌کننده و تایمرهای
              دروغین.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 gap-2 px-6 text-base shadow-soft">
                <Link href="/services/instagram">
                  <Instagram className="h-5 w-5" />
                  خدمات اینستاگرام
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 gap-2 px-6 text-base">
                <Link href="/services/youtube">
                  <Youtube className="h-5 w-5" />
                  خدمات یوتیوب
                </Link>
              </Button>
            </div>

            {/* Mini stats */}
            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-2 sm:gap-6">
              {[
                {
                  stat: (
                    <AnimatedCounter
                      value={50000}
                      prefix="+"
                      className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                    />
                  ),
                  label: "سفارش موفق",
                },
                {
                  stat: (
                    <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      <AnimatedCounter value={98} suffix="٪" />
                    </span>
                  ),
                  label: "رضایت کاربران",
                },
                {
                  stat: (
                    <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      ۲۴<span className="mx-0.5 text-muted-foreground">/</span>۷
                    </span>
                  ),
                  label: "پشتیبانی",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-border/60 bg-card/60 p-4 text-center backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card"
                >
                  <div className="tnum tabular-nums">{s.stat}</div>
                  <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- VALUE PROPS ---------- */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="container mx-auto grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "پرداخت امن",
              desc: "پرداخت فقط از درگاه معتبر زرین‌پال. کیف پول شما با دفتر ثبت تغییرات غیرقابل تغییر.",
            },
            {
              icon: Zap,
              title: "تحویل شفاف",
              desc: "هر سفارش یک صفحه رهگیری اختصاصی دارد. از لحظه ثبت تا تکمیل، قدم‌به‌قدم با خبر می‌شوید.",
            },
            {
              icon: Headset,
              title: "پشتیبانی صادقانه",
              desc: "تیم پشتیبانی انسانی برای هر سفارش. اگر مشکلی پیش آمد، شفاف می‌گوییم و جبران می‌کنیم.",
            },
          ].map((v) => (
            <div key={v.title} className="bg-background p-6 sm:p-8">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FEATURED SERVICES ---------- */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <TrendingUp className="h-4 w-4" />
              محبوب‌ترین خدمات
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              انتخاب از میان سرویس‌های منتخب
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              هر سرویس سه سطح کیفی دارد: اقتصادی، استاندارد و حرفه‌ای. انتخاب با شماست.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/services/instagram" className="gap-1.5">
                <Instagram className="h-4 w-4" />
                اینستاگرام
                <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/services/youtube" className="gap-1.5">
                <Youtube className="h-4 w-4" />
                یوتیوب
                <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              رشد در سه قدم ساده
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              بدون نیاز به دانش فنی. شما انتخاب می‌کنید، ما انجام می‌دهیم.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                n: "۱",
                title: "سرویس و سطح را انتخاب کنید",
                desc: "از بین خدمات منتخب، سطح کیفی مناسب بودجه‌تان را انتخاب کنید. هر سطح واقعاً متفاوت است.",
                icon: Star,
              },
              {
                n: "۲",
                title: "لینک بدهید و پرداخت کنید",
                desc: "لینک پست یا پیج را وارد کنید، تعداد را تنظیم کنید و از کیف پول یا درگاه پرداخت کنید.",
                icon: Wallet,
              },
              {
                n: "۳",
                title: "زنده ردگیری کنید",
                desc: "هر سفارش یک صفحه رهگیری دارد. پیشرفت را قدم‌به‌قدم می‌بینید تا تکمیل شود.",
                icon: Clock,
              },
            ].map((step, i) => (
              <div
                key={step.n}
                className="relative rounded-2xl border border-border/60 bg-background p-6 shadow-soft"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground">
                    {step.n}
                  </span>
                  <step.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{step.desc}</p>
                {i < 2 && (
                  <div className="absolute -left-3 top-1/2 hidden h-px w-6 bg-border md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FEATURED REVIEWS (honest social proof) ---------- */}
      <FeaturedReviewsSection />

      {/* ---------- TRUST / FAQ-LITE ---------- */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              چرا رشدیار متفاوت است؟
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              بازار پنل‌های رشد ایرانی پر از جدول‌های گیج‌کننده، تایمرهای دروغین و
              وعده‌های غیرواقعی است. ما یک محصول متفاوت ساختیم:
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "هیچ تایمر دروغین یا «X نفر خرید» فیک نداریم",
                "هیچ نام عجیب فنی مثل «IG Followers HQ Non-drop R30» نداریم",
                "هر سرویس یک نام فارسی، توضیح ساده و شفافیت کامل درباره افت و ری‌فیل دارد",
                "پول شما تا تأیید تحویل، در کیف پول امن رشدیار است",
                "در صورت ناکامی، مبلغ به‌طور خودکار به کیف پول بازمی‌گردد",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm leading-7 text-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing examples */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">نمونه قیمت‌ها</h3>
              <span className="text-xs text-muted-foreground">به ازای هر ۱٬۰۰۰</span>
            </div>
            <div className="space-y-3">
              {[
                { name: "فالوور اینستاگرام — استاندارد", price: 65000, unit: "تومان" },
                { name: "لایک اینستاگرام — استاندارد", price: 32000, unit: "تومان" },
                { name: "بازدید اینستاگرام — استاندارد", price: 7500, unit: "تومان" },
                { name: "بازدید یوتیوب — استاندارد", price: 38000, unit: "تومان" },
              ].map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between rounded-xl bg-background/60 px-4 py-3"
                >
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <div className="text-end">
                    <span className="tnum font-bold tabular-nums text-foreground">
                      {formatToman(p.price)}
                    </span>
                    <span className="mr-1 text-xs text-muted-foreground">تومان</span>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link href="/services/instagram">مشاهده همه خدمات</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="border-t border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              آماده‌اید شروع کنید؟
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              ثبت‌نام کنید، ۵۰٬۰۰۰ تومان اعتبار خوش‌آمدگویی بگیرید و اولین سفارش‌تان را همین حالا ثبت کنید.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/register">ثبت‌نام کنید</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 px-6 text-base">
                <Link href="/login">ورود به حساب</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
