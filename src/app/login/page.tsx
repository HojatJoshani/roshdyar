import { Suspense } from "react";
import Link from "next/link";
import { AuthBrandPanel } from "@/components/brand/auth-brand-panel";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/brand/logo";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ورود | رشدیار",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Brand panel (right side in RTL visual layout — it's `aside` first in DOM but appears on the right because of RTL)
          Actually since this is RTL, the first flex child appears on the right. We want the form on the right
          (closer to where the eye starts reading) and the brand showcase on the left. So we render the form first. */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 md:order-1 md:px-10 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile-only logo (brand panel is hidden on mobile) */}
          <div className="mb-8 flex justify-center md:hidden">
            <Link href="/" aria-label="رشدیار">
              <Logo size={36} />
            </Link>
          </div>

          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              ورود به حساب
            </h1>
            <p className="text-sm text-muted-foreground">
              برای ادامه به حساب رشدیار خود وارد شوید.
            </p>
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>ورود امن از طریق NextAuth — اطلاعات شما هرگز به اشتراک گذاشته نمی‌شود.</span>
          </div>
        </div>
      </main>

      <AuthBrandPanel />
    </div>
  );
}
