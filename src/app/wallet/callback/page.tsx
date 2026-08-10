"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SiteShell } from "@/components/brand/site-shell";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { toFaDigits } from "@/lib/format";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  ArrowRight,
  RotateCw,
  Wallet,
} from "lucide-react";

type State =
  | { kind: "loading" }
  | { kind: "success"; refId?: string; balanceAfter?: number }
  | { kind: "alreadyPaid"; refId?: string }
  | { kind: "error"; reason: string };

function CallbackContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { refetch } = useWalletBalance();
  const [state, setState] = useState<State>({ kind: "loading" });
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const authority = search.get("Authority") ?? "";
    const status = search.get("Status") ?? "";
    const paymentId = search.get("paymentId") ?? "";

    const qs = new URLSearchParams({ Authority: authority, Status: status, paymentId });
    fetch(`/api/wallet/callback?${qs.toString()}`, { method: "POST" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setState({
            kind: "error",
            reason:
              !authority || !paymentId
                ? "پارامترهای پرداخت ناقص است. لطفاً از طریق کیف پول دوباره تلاش کنید."
                : data?.error === "NOT_FOUND"
                ? "این پرداخت پیدا نشد. لطفاً مجدداً تلاش کنید."
                : data?.error === "AUTHORITY_MISMATCH"
                ? "اطلاعات پرداخت نامعتبر است."
                : "تأیید پرداخت ناموفق بود. در صورت کسر مبلغ، حداکثر پس از ۲۴ ساعت بازگردانده می‌شود.",
          });
          return;
        }
        if (data.alreadyPaid) {
          setState({ kind: "alreadyPaid", refId: data.refId });
        } else if (data.ok === false) {
          // USER_CANCELED or other soft failure
          setState({
            kind: "error",
            reason:
              data?.error === "USER_CANCELED"
                ? "پرداخت توسط شما لغو شد."
                : "پرداخت ناموفق بود. در صورت کسر مبلغ، حداکثر پس از ۲۴ ساعت بازگردانده می‌شود.",
          });
        } else {
          setState({
            kind: "success",
            refId: data.refId,
            balanceAfter: data.balanceAfter,
          });
        }
        // Refresh wallet balance in header / wallet page
        refetch();
      })
      .catch(() => {
        setState({
          kind: "error",
          reason: "اتصال به سرور ناموفق بود. لطفاً دوباره تلاش کنید.",
        });
      });
  }, [search, refetch]);

  return (
    <SiteShell hideFooter>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center">
            <Logo size={32} />
          </div>

          <AnimatePresence mode="wait">
            {state.kind === "loading" && <LoadingCard key="loading" />}
            {state.kind === "success" && (
              <ResultCard
                key="success"
                tone="success"
                icon={<CheckCircle2 className="h-10 w-10" />}
                title="پرداخت با موفقیت انجام شد"
                description="مبلغ به کیف پول شما افزوده شد."
                refId={state.refId}
                balanceAfter={state.balanceAfter}
                primary={
                  <Button
                    onClick={() => router.push("/wallet")}
                    className="h-11 w-full gap-2 font-semibold shadow-soft"
                  >
                    <ArrowRight className="h-4 w-4 rtl-flip" />
                    بازگشت به کیف پول
                  </Button>
                }
                secondary={
                  <Link
                    href="/services/instagram"
                    className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    مشاهده خدمات
                  </Link>
                }
              />
            )}
            {state.kind === "alreadyPaid" && (
              <ResultCard
                key="alreadyPaid"
                tone="info"
                icon={<Info className="h-10 w-10" />}
                title="این پرداخت قبلاً تأیید شده است"
                description="مبلغ این تراکنش پیش‌تر به کیف پول شما افزوده شده است."
                refId={state.refId}
                primary={
                  <Button
                    onClick={() => router.push("/wallet")}
                    className="h-11 w-full gap-2 font-semibold shadow-soft"
                  >
                    <Wallet className="h-4 w-4" />
                    بازگشت به کیف پول
                  </Button>
                }
              />
            )}
            {state.kind === "error" && (
              <ResultCard
                key="error"
                tone="error"
                icon={<XCircle className="h-10 w-10" />}
                title="پرداخت ناموفق بود"
                description={state.reason}
                primary={
                  <Button
                    onClick={() => router.push("/wallet")}
                    className="h-11 w-full gap-2 font-semibold shadow-soft"
                  >
                    <RotateCw className="h-4 w-4" />
                    تلاش مجدد
                  </Button>
                }
                secondary={
                  <Link
                    href="/support/new?category=payment"
                    className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    تماس با پشتیبانی
                  </Link>
                }
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </SiteShell>
  );
}

function LoadingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft"
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        در حال تأیید پرداخت…
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        لطفاً این صفحه را نبندید. چند ثانیه طول می‌کشد.
      </p>
    </motion.div>
  );
}

function ResultCard({
  tone,
  icon,
  title,
  description,
  refId,
  balanceAfter,
  primary,
  secondary,
}: {
  tone: "success" | "error" | "info";
  icon: React.ReactNode;
  title: string;
  description: string;
  refId?: string;
  balanceAfter?: number;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  const toneMap = {
    success: {
      halo: "bg-emerald-500/12",
      iconWrap: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      refBg: "bg-emerald-500/8 border-emerald-500/20",
    },
    error: {
      halo: "bg-red-500/12",
      iconWrap: "bg-red-500/15 text-red-600 dark:text-red-400",
      refBg: "bg-red-500/8 border-red-500/20",
    },
    info: {
      halo: "bg-primary/10",
      iconWrap: "bg-primary/15 text-primary",
      refBg: "bg-muted border-border",
    },
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -8 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft"
    >
      {/* Halo header */}
      <div className={`flex flex-col items-center px-6 pb-2 pt-8 ${toneMap.halo}`}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.3, ease: "backOut" }}
          className={`mb-2 flex h-20 w-20 items-center justify-center rounded-full ${toneMap.iconWrap}`}
        >
          {icon}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.25 }}
          className="text-center text-xl font-bold text-foreground"
        >
          {title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.25 }}
          className="mt-1.5 max-w-xs text-center text-sm leading-6 text-muted-foreground"
        >
          {description}
        </motion.p>
      </div>

      <div className="space-y-3 p-6">
        {/* Tracking code / refId */}
        {refId && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.25 }}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${toneMap.refBg}`}
          >
            <span className="text-xs text-muted-foreground">کد پیگیری</span>
            <span className="tnum font-mono text-sm font-bold tabular-nums text-foreground">
              {toFaDigits(refId)}
            </span>
          </motion.div>
        )}

        {/* Balance after (success only) */}
        {tone === "success" && typeof balanceAfter === "number" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.25 }}
            className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3"
          >
            <span className="text-xs text-muted-foreground">موجودی جدید کیف پول</span>
            <span className="tnum text-sm font-bold tabular-nums text-foreground">
              {toFaDigits(balanceAfter.toLocaleString("en-US"))}{" "}
              <span className="text-[10px] font-normal text-muted-foreground">تومان</span>
            </span>
          </motion.div>
        )}

        {primary}
        {secondary}
      </div>
    </motion.div>
  );
}

export default function WalletCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <SiteShell hideFooter>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center">
            <Logo size={32} />
          </div>
          <LoadingCard />
        </div>
      </div>
    </SiteShell>
  );
}
