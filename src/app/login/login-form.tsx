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
  LogIn,
  ArrowLeft,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fromParam = params.get("from") || "/";
  const reason = params.get("reason");

  useEffect(() => {
    // Only redirect once we know for sure the user is authenticated.
    // During the initial "loading" status, do nothing — avoids a redirect
    // race when an unauthenticated visitor lands here.
    if (status === "authenticated" && session?.user) {
      router.replace(fromParam);
    }
  }, [status, session, router, fromParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("ایمیل و رمز عبور را وارد کنید.");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!res || res.error) {
        // signIn returns error: "CredentialsSignin" for authorize() returning null,
        // and the thrown Error message for authorize() throwing.
        if (res?.error === "CredentialsSignin" && res?.status === 401) {
          // Could be wrong credentials OR a banned account — we can't distinguish
          // from the generic error, so we show the safe message.
          toast.error("ایمیل یا رمز عبور اشتباه است.");
        } else {
          toast.error("ایمیل یا رمز عبور اشتباه است.");
        }
        setLoading(false);
        return;
      }
      toast.success("خوش آمدید!");
      router.push(fromParam);
      router.refresh();
    } catch {
      toast.error("خطایی رخ داد. لطفاً دوباره تلاش کنید.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {reason === "auth" && (
        <Alert className="border-primary/25 bg-primary/5 text-primary">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-primary">
            برای ادامه باید وارد شوید.
          </AlertDescription>
        </Alert>
      )}

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

      {/* Password */}
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
            autoComplete="current-password"
            dir="ltr"
            className="h-11 pr-9 text-left"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
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
          <LogIn className="h-4 w-4" />
        )}
        ورود
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        حساب ندارید؟{" "}
        <Link
          href={`/register${
            fromParam && fromParam !== "/" ? `?from=${encodeURIComponent(fromParam)}` : ""
          }`}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          ثبت‌نام کنید
          <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
        </Link>
      </div>
    </form>
  );
}
