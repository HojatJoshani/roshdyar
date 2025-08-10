import { Logo } from "@/components/brand/logo";
import { ShieldCheck, Zap, Headset, TrendingUp } from "lucide-react";

/**
 * Shared left-side brand showcase panel used by /login and /register.
 * Hidden on mobile (md:hidden) — only the form panel shows on small screens.
 * On desktop it takes ~46% of the viewport width on the right (RTL: visually left).
 */
export function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-mesh-brand md:flex md:w-[46%] md:flex-col md:justify-between md:p-12">
      {/* Decorative grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

      {/* Soft floating glow */}
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Top: logo */}
      <div className="relative">
        <Logo size={34} />
      </div>

      {/* Middle: tagline + value props */}
      <div className="relative space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
            پلتفرم رشد اینستاگرام و یوتیوب
          </div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground xl:text-4xl">
            رشدی که می‌توانی
            <br />
            <span className="text-gradient-brand">به آن اعتماد کنی.</span>
          </h2>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            کیفیتی واقعی، تحویل شفاف با رهگیری لحظه‌ای و پشتیبانی صادقانه. نه
            وعده‌های تبلیغاتی، نه تایمرهای دروغین.
          </p>
        </div>

        <ul className="space-y-3">
          {[
            {
              icon: ShieldCheck,
              title: "پرداخت امن",
              desc: "پرداخت از درگاه معتبر زرین‌پال با دفتر ثبت تغییرات غیرقابل تغییر.",
            },
            {
              icon: Zap,
              title: "تحویل شفاف",
              desc: "هر سفارش یک صفحه رهگیری اختصاصی دارد — قدم‌به‌قدم.",
            },
            {
              icon: Headset,
              title: "پشتیبانی انسانی",
              desc: "تیم پشتیبانی واقعی برای هر سفارش، در صورت نیاز جبران می‌کنیم.",
            },
          ].map((v) => (
            <li key={v.title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-card/80 text-primary shadow-sm backdrop-blur-sm">
                <v.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{v.title}</div>
                <div className="mt-0.5 text-xs leading-6 text-muted-foreground">
                  {v.desc}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom: testimonial / micro stats */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-6">
          {[
            { v: "+۵۰٬۰۰۰", l: "سفارش موفق" },
            { v: "۹۸٪", l: "رضایت کاربران" },
            { v: "۲۴/۷", l: "پشتیبانی" },
          ].map((s) => (
            <div key={s.l} className="text-center sm:text-right">
              <div className="text-lg font-bold tracking-tight text-foreground tnum">
                {s.v}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
