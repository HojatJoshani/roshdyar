import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Instagram, Youtube, ShieldCheck, Zap, Headset } from "lucide-react";

const yearStr = (() => {
  try {
    return new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());
  } catch {
    return "۱۴۰۳";
  }
})();

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">
              پلتفرم رشد اینستاگرام و یوتیوب با کیفیتی که می‌فهمی، تحویل شفاف و
              پشتیبانی صادقانه.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">خدمات</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/services/instagram" className="link-underline hover:text-foreground">
                  فالوور اینستاگرام
                </Link>
              </li>
              <li>
                <Link href="/services/instagram" className="link-underline hover:text-foreground">
                  لایک اینستاگرام
                </Link>
              </li>
              <li>
                <Link href="/services/instagram" className="link-underline hover:text-foreground">
                  بازدید اینستاگرام
                </Link>
              </li>
              <li>
                <Link href="/services/youtube" className="link-underline hover:text-foreground">
                  بازدید یوتیوب
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">حساب کاربری</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/orders" className="link-underline hover:text-foreground">سفارش‌های من</Link>
              </li>
              <li>
                <Link href="/wallet" className="link-underline hover:text-foreground">کیف پول</Link>
              </li>
              <li>
                <Link href="/support" className="link-underline hover:text-foreground">پشتیبانی</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">چرا رشدیار؟</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                پرداخت امن از درگاه معتبر
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                تحویل شفاف با رهگیری لحظه‌ای
              </li>
              <li className="flex items-center gap-2">
                <Headset className="h-4 w-4 text-primary" />
                پشتیبانی واقعی انسانی
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {yearStr} رشدیار — تمامی حقوق محفوظ است.</p>
          <div className="flex items-center gap-4">
            <Link href="/legal/terms" className="link-underline hover:text-foreground">قوانین و مقررات</Link>
            <Link href="/legal/privacy" className="link-underline hover:text-foreground">حریم خصوصی</Link>
            <Link href="/support" className="link-underline hover:text-foreground">تماس با ما</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
