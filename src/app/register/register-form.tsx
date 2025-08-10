"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  UserPlus,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function computePasswordScore(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..4
}

const STRENGTH_META = [
  { label: "خیلی ضعیف", color: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  { label: "ضعیف", color: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  { label: "متوسط", color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { label: "قوی", color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  { label: "بسیار قوی", color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
];

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fromParam = params.get("from") || "/";

  useEffect(() => {
    // Only redirect once we know for sure the user is authenticated.
    if (status === "authenticated" && session?.user) {
      router.replace(fromParam);
    }
  }, [status, session, router, fromParam]);

  const pwScore = computePasswordScore(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("ایمیل و رمز عبور را وارد کنید.");
      return;
    }
    if (password.length < 8) {
      toast.error("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }
    setLoading(true);

    try {
      // 1) Register
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
        }),
      });

      if (regRes.status === 409) {
        toast.error("این ایمیل قبلاً ثبت شده است.");
        setLoading(false);
        return;
      }
      if (!regRes.ok) {
        const body = await regRes.json().catch(() => null);
        const msg = body?.message || "ثبت‌نام ناموفق بود. لطفاً دوباره تلاش کنید.";
        toast.error(msg);
        setLoading(false);
        return;
      }

      // 2) Auto-login
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!signInRes || signInRes.error) {
        // Account was created — redirect to login so user can log in manually.
        toast.success("حساب ساخته شد! لطفاً وارد شوید.");
        router.push(`/login?from=${encodeURIComponent(fromParam)}`);
        return;
      }

      toast.success("خوش آمدید به رشدیار! ۵۰٬۰۰۰ تومان اعتبار تستی شارژ شد.");
      router.push(fromParam);
      router.refresh();
    } catch {
      toast.error("خطایی رخ داد. لطفاً دوباره تلاش کنید.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Name (optional) */}
      <div className="space-y-2">
        <Label htmlFor="name">
          نام <span className="text-muted-foreground font-normal">(اختیاری)</span>
        </Label>
        <div className="relative">
          <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            autoComplete="name"
            dir="rtl"
            className="h-11 pr-9"
            placeholder="نام شما"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            maxLength={80}
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">ایمیل</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            className="h-11 pr-9 text-left"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      {/* Password + strength meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">رمز عبور</Label>
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            tabIndex={-1}
            aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
          >
            {showPassword ? (
              <span className="flex items-center gap-1">
                <EyeOff className="h-3.5 w-3.5" /> پنهان
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> نمایش
              </span>
            )}
          </button>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            dir="ltr"
            className="h-11 pr-9 text-left"
            placeholder="حداقل ۸ کاراکتر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            minLength={8}
          />
        </div>

        {/* Strength meter */}
        {password.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full bg-muted transition-colors",
                    pwScore > i && STRENGTH_META[pwScore].color
                  )}
                />
              ))}
            </div>
            <div className={cn("text-[11px] font-medium", STRENGTH_META[pwScore].text)}>
              {STRENGTH_META[pwScore].label}
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full gap-2 text-base shadow-soft"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        ثبت‌نام
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        حساب دارید؟{" "}
        <Link
          href={`/login${
            fromParam && fromParam !== "/" ? `?from=${encodeURIComponent(fromParam)}` : ""
          }`}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          وارد شوید
          <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
        </Link>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        <span>با ثبت‌نام، قوانین و مقررات رشدیار را می‌پذیرید.</span>
      </div>
    </form>
  );
}
