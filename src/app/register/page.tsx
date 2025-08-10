import { Suspense } from "react";
import Link from "next/link";
import { AuthBrandPanel } from "@/components/brand/auth-brand-panel";
import { RegisterForm } from "./register-form";
import { Logo } from "@/components/brand/logo";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ثبت‌نام | رشدیار",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 md:px-10 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile-only logo */}
          <div className="mb-8 flex justify-center md:hidden">
            <Link href="/" aria-label="رشدیار">
              <Logo size={36} />
            </Link>
          </div>

          <div className="mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              ۵۰٬۰۰۰ تومان اعتبار تستی هدیه
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              ساخت حساب جدید
            </h1>
            <p className="text-sm text-muted-foreground">
              تنها چند ثانیه طول می‌کشد — بدون کارت اعتباری.
            </p>
          </div>

          <Suspense fallback={null}>
            <RegisterForm />
          </Suspense>
        </div>
      </main>

      <AuthBrandPanel />
    </div>
  );
}
