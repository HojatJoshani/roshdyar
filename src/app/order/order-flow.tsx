"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { TierBadge } from "@/components/brand/tier-badge";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import {
  PLATFORM_META,
  CATEGORY_META,
  type Tier,
  type Platform,
  type Category,
} from "@/lib/constants";
import {
  formatToman,
  formatQuantity,
  toFaDigits,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  Info,
  Link2,
  Loader2,
  Lock,
  PartyPopper,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
  AlertCircle,
  ArrowLeft,
  Home,
  Ticket,
  X,
} from "lucide-react";

export interface OrderFlowTierData {
  serviceTierId: string;
  serviceName: string;
  serviceSlug: string;
  serviceEmoji: string;
  platform: string;
  category: string;
  summary: string;
  tier: Tier;
  tierDisplayName: string;
  tierTagline: string;
  pricePer1000: number;
  minQuantity: number;
  maxQuantity: number;
  step: number;
  deliveryEstimate: string;
  refillPolicy: string;
  refundPolicy: string;
  quantity: number;
  targetLink: string;
  totalAmount: number;
}

type Step = "review" | "terms" | "payment" | "done";

interface SubmitResult {
  ok: boolean;
  insufficient: boolean;
  orderId?: string;
  orderCode?: string;
  status?: string;
  totalAmount?: number;
  message?: string;
  error?: string;
}

const STEPS: { id: Step; label: string; index: number }[] = [
  { id: "review", label: "بررسی سفارش", index: 0 },
  { id: "terms", label: "تأیید قوانین", index: 1 },
  { id: "payment", label: "پرداخت", index: 2 },
  { id: "done", label: "ثبت موفق", index: 3 },
];

export function OrderFlow({ tier }: { tier: OrderFlowTierData }) {
  const router = useRouter();
  const { balance, isLoading } = useWalletBalance();

  const [step, setStep] = useState<Step>("review");
  const [accepted, setAccepted] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<{
    code: string;
    discount: number;
    description?: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const platformMeta =
    PLATFORM_META[tier.platform as Platform] ??
    ({ label: tier.platform, emoji: "📦", color: "#64748b" } as const);
  const categoryMeta =
    CATEGORY_META[tier.category as Category] ??
    ({ label: tier.category, emoji: "📦" } as const);

  const grossTotal = tier.totalAmount;
  const discount = promoApplied?.discount ?? 0;
  const total = Math.max(0, grossTotal - discount);
  const shortfall = Math.max(0, total - balance);
  const balanceOk = !isLoading && balance >= total;

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const r = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          amount: grossTotal,
          platform: tier.platform,
          serviceSlug: tier.serviceSlug,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) {
        setPromoApplied({
          code: data.code,
          discount: data.discountAmount,
          description: data.description,
        });
        setPromoError(null);
        return;
      }
      setPromoApplied(null);
      setPromoError(data?.message ?? "کد نامعتبر است.");
    } catch {
      setPromoError("ارتباط با سرور برقرار نشد.");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoApplied(null);
    setPromoInput("");
    setPromoError(null);
  };

  const onSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceTierId: tier.serviceTierId,
          quantity: tier.quantity,
          targetLink: tier.targetLink,
          notes: notes.trim() || undefined,
          acceptedTerms: true,
          pay: true,
          promoCode: promoApplied?.code || undefined,
        }),
      });
      const data = await r.json().catch(() => ({}));

      if (r.ok && data?.order) {
        setResult({
          ok: true,
          insufficient: false,
          orderId: data.order.id,
          orderCode: data.order.code,
          status: data.order.status,
          totalAmount: data.order.totalAmount,
        });
        setStep("done");
        return;
      }

      if (r.status === 402 && data?.error === "INSUFFICIENT_FUNDS") {
        // Order WAS created in PENDING status. Show the "registered but unpaid" state.
        setResult({
          ok: true,
          insufficient: true,
          orderId: data.orderId,
          orderCode: data.code,
          status: data.status ?? "PENDING",
          totalAmount: data.totalAmount ?? total,
          message: data.message,
        });
        setStep("done");
        return;
      }

      // Genuine failure.
      setResult({
        ok: false,
        insufficient: false,
        error:
          data?.message ??
          data?.error ??
          "ثبت سفارش با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
      });
    } catch {
      setResult({
        ok: false,
        insufficient: false,
        error: "ارتباط با سرور برقرار نشد. اینترنت خود را بررسی و دوباره تلاش کنید.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <StepIndicator currentIndex={stepIndex} />

      <AnimatePresence mode="wait" initial={false}>
        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ReviewStep tier={tier} platformMeta={platformMeta} categoryMeta={categoryMeta} />
            <StepNav
              onNext={() => setStep("terms")}
              nextLabel="ادامه به تأیید قوانین"
              nextIcon={<ShieldCheck className="h-4 w-4" />}
            />
          </motion.div>
        )}

        {step === "terms" && (
          <motion.div
            key="terms"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <TermsStep tier={tier} accepted={accepted} setAccepted={setAccepted} />
            <StepNav
              onPrev={() => setStep("review")}
              prevLabel="بازگشت"
              prevIcon={<ChevronLeft className="h-4 w-4 rtl-flip" />}
              onNext={() => setStep("payment")}
              nextLabel="ادامه به پرداخت"
              nextIcon={<ChevronLeft className="h-4 w-4" />}
              nextDisabled={!accepted}
            />
          </motion.div>
        )}

        {step === "payment" && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <PaymentStep
              tier={tier}
              balance={balance}
              isLoading={isLoading}
              grossTotal={grossTotal}
              total={total}
              shortfall={shortfall}
              balanceOk={balanceOk}
              notes={notes}
              setNotes={setNotes}
              submitting={submitting}
              onSubmit={onSubmit}
              promoInput={promoInput}
              setPromoInput={setPromoInput}
              promoApplied={promoApplied}
              promoError={promoError}
              promoLoading={promoLoading}
              onApplyPromo={applyPromo}
              onRemovePromo={removePromo}
            />
            <StepNav
              onPrev={() => setStep("terms")}
              prevLabel="بازگشت"
              prevIcon={<ChevronLeft className="h-4 w-4 rtl-flip" />}
            />
          </motion.div>
        )}

        {step === "done" && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <SuccessStep
              tier={tier}
              result={result}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {step !== "done" && result?.ok === false && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>خطا در ثبت سفارش</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/* ----------------------------- Step indicator ---------------------------- */

function StepIndicator({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-1 sm:gap-2">
      {STEPS.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={s.id} className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums transition-colors sm:h-8 sm:w-8 sm:text-xs",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-soft"
                    : done
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground"
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  toFaDigits(i + 1)
                )}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline sm:text-sm",
                  active
                    ? "text-foreground"
                    : done
                      ? "text-primary"
                      : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 transition-colors sm:w-10",
                  i < currentIndex ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- Step nav ------------------------------- */

function StepNav({
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  prevIcon,
  nextIcon,
  nextDisabled,
}: {
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  prevIcon?: React.ReactNode;
  nextIcon?: React.ReactNode;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      {onPrev ? (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onPrev}
          className="gap-1.5"
        >
          {prevIcon}
          {prevLabel}
        </Button>
      ) : (
        <span />
      )}
      {onNext && (
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          disabled={nextDisabled}
          className="gap-1.5 shadow-soft"
        >
          {nextLabel}
          {nextIcon}
        </Button>
      )}
    </div>
  );
}

/* ------------------------------ Review step ------------------------------ */

function ReviewStep({
  tier,
  platformMeta,
  categoryMeta,
}: {
  tier: OrderFlowTierData;
  platformMeta: { label: string; emoji: string; color: string };
  categoryMeta: { label: string; emoji: string };
}) {
  return (
    <Card className="overflow-hidden p-0">
      {/* Service header */}
      <div className="relative border-b border-border/60 bg-gradient-to-l from-primary/5 via-transparent to-transparent p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-3xl">
            {tier.serviceEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                {categoryMeta.emoji} {categoryMeta.label}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-bold text-foreground sm:text-xl">
              {tier.serviceName}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <TierBadge tier={tier.tier} />
              <span className="text-xs text-muted-foreground">
                {tier.tierDisplayName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail rows */}
      <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <DetailRow
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          label="تعداد سفارش"
          value={
            <span className="tnum font-semibold tabular-nums text-foreground">
              {formatQuantity(tier.quantity)}
            </span>
          }
        />
        <DetailRow
          icon={<Clock className="h-4 w-4 text-primary" />}
          label="زمان تحویل تخمینی"
          value={
            <span className="font-medium text-foreground">
              {tier.deliveryEstimate}
            </span>
          }
        />
      </div>

      {/* Link */}
      <div className="border-t border-border/60 p-5 sm:p-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" />
          لینک هدف
        </div>
        <a
          href={tier.targetLink}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          <span className="truncate font-mono text-xs text-muted-foreground group-hover:text-foreground sm:text-sm">
            {tier.targetLink}
          </span>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
        </a>
      </div>

      {/* Price summary */}
      <div className="border-t border-border/60 bg-muted/30 p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">قیمت هر ۱٬۰۰۰</span>
          <span className="tnum font-medium tabular-nums text-foreground">
            {formatToman(tier.pricePer1000)}{" "}
            <span className="text-[10px] text-muted-foreground">تومان</span>
          </span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-sm font-medium text-foreground">مبلغ قابل پرداخت</span>
          <div className="text-end">
            <span className="tnum text-2xl font-bold tabular-nums text-primary sm:text-3xl">
              {formatToman(tier.totalAmount)}
            </span>
            <span className="mr-1.5 text-xs text-muted-foreground">تومان</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      {value}
    </div>
  );
}

/* ------------------------------- Terms step ------------------------------ */

function TermsStep({
  tier,
  accepted,
  setAccepted,
}: {
  tier: OrderFlowTierData;
  accepted: boolean;
  setAccepted: (v: boolean) => void;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">تأیید قوانین سرویس</h2>
          <p className="text-xs text-muted-foreground">
            لطفاً قوانین زیر را مطالعه کنید.
          </p>
        </div>
      </div>

      {/* Policy cards */}
      <div className="mb-5 space-y-3">
        <PolicyCard
          icon={<RefreshCw className="h-4 w-4 text-primary" />}
          title="سیاست ری‌فیل"
          text={tier.refillPolicy}
        />
        <PolicyCard
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          title="سیاست بازگشت وجه"
          text={tier.refundPolicy}
        />
        <PolicyCard
          icon={<Info className="h-4 w-4 text-primary" />}
          title="نکات مهم"
          text="تحویل به‌صورت تدریجی انجام می‌شود تا الگوریتم پلتفرم مشکوک نشود. حساب یا پست هدف باید عمومی باشد. در صورت خصوصی بودن، سفارش متوقف و مبلغ بازگردانده نمی‌شود."
        />
      </div>

      {/* Acceptance checkbox */}
      <label
        htmlFor="accept-terms"
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
          accepted
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/40"
        )}
      >
        <Checkbox
          id="accept-terms"
          checked={accepted}
          onCheckedChange={(v) => setAccepted(v === true)}
          className="mt-0.5"
        />
        <span className="text-sm leading-6 text-foreground">
          قوانین سرویس را خوانده‌ام و می‌پذیرم. تأیید می‌کنم که لینک وارد شده
          متعلق به من است و حساب/پست هدف در حالت عمومی قرار دارد.
        </span>
      </label>

      {/* Lock hint */}
      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="h-3 w-3" />
        پرداخت فقط پس از پذیرش قوانین فعال می‌شود.
      </div>
    </Card>
  );
}

function PolicyCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
          {icon}
        </span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-xs leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

/* ------------------------------ Payment step ----------------------------- */

function PaymentStep({
  tier,
  balance,
  isLoading,
  grossTotal,
  total,
  shortfall,
  balanceOk,
  notes,
  setNotes,
  submitting,
  onSubmit,
  promoInput,
  setPromoInput,
  promoApplied,
  promoError,
  promoLoading,
  onApplyPromo,
  onRemovePromo,
}: {
  tier: OrderFlowTierData;
  balance: number;
  isLoading: boolean;
  grossTotal: number;
  total: number;
  shortfall: number;
  balanceOk: boolean;
  notes: string;
  setNotes: (v: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  promoInput: string;
  setPromoInput: (v: string) => void;
  promoApplied: { code: string; discount: number; description?: string } | null;
  promoError: string | null;
  promoLoading: boolean;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
}) {
  const walletUrl = `/wallet?amount=${shortfall}`;
  const hasDiscount = promoApplied && promoApplied.discount > 0;

  return (
    <div className="space-y-5">
      {/* Wallet balance card */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">کیف پول</h2>
            <p className="text-xs text-muted-foreground">موجودی فعلی شما</p>
          </div>
        </div>

        <div className="flex items-end justify-between rounded-xl bg-muted/40 p-4">
          <span className="text-xs text-muted-foreground">موجودی</span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <span className="tnum text-xl font-bold tabular-nums text-foreground">
              {formatToman(balance)}
              <span className="mr-1 text-xs text-muted-foreground">تومان</span>
            </span>
          )}
        </div>

        {/* Insufficient funds warning */}
        {!isLoading && !balanceOk && (
          <Alert className="mt-4 border-amber-500/30 bg-amber-500/8 text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>موجودی کافی نیست</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>
                برای ثبت این سفارش به{" "}
                <span className="tnum font-semibold tabular-nums">
                  {formatToman(shortfall)}
                </span>{" "}
                تومان دیگر نیاز دارید. کیف پول خود را شارژ کنید، سپس دوباره
                تلاش کنید.
              </span>
              <Button asChild size="sm" className="w-fit gap-1.5">
                <Link href={walletUrl}>
                  <Wallet className="h-3.5 w-3.5" />
                  شارژ کیف پول
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Promo code */}
      <Card className="p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Ticket className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">کد تخفیف</h2>
            <p className="text-xs text-muted-foreground">اگر کد تخفیف دارید، وارد کنید</p>
          </div>
        </div>

        {promoApplied ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="tnum font-mono text-sm font-bold tabular-nums text-foreground">
                    {promoApplied.code}
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    {formatToman(promoApplied.discount)} ت تخفیف
                  </span>
                </div>
                {promoApplied.description && (
                  <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                    {promoApplied.description}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemovePromo}
              className="h-8 gap-1 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
            >
              <X className="h-3.5 w-3.5" />
              حذف
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value.toUpperCase());
                if (promoError) setPromoError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !promoLoading && promoInput.trim()) {
                  e.preventDefault();
                  onApplyPromo();
                }
              }}
              placeholder="مثلاً WELCOME10"
              dir="ltr"
              className="h-11 font-mono text-sm"
              disabled={promoLoading}
              maxLength={40}
            />
            <Button
              type="button"
              onClick={onApplyPromo}
              disabled={promoLoading || !promoInput.trim()}
              className="h-11 gap-1.5 px-4"
            >
              {promoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Ticket className="h-4 w-4" />
              )}
              اعمال
            </Button>
          </div>
        )}
        {promoError && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400">
            <AlertCircle className="h-3 w-3" />
            {promoError}
          </p>
        )}
        {!promoApplied && !promoError && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            کد تخفیف را امتحان کنید: <span className="font-mono">WELCOME10</span> (۱۰٪ تخفیف)
          </p>
        )}
      </Card>

      {/* Notes */}
      <Card className="p-5 sm:p-6">
        <Label htmlFor="order-notes" className="mb-2 block text-xs font-medium text-muted-foreground">
          یادداشت سفارش (اختیاری)
        </Label>
        <Input
          id="order-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          placeholder="هر یادداشت یا توضیح اضافه برای پشتیبانی…"
          className="h-11"
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          این یادداشت در صفحه سفارش شما و برای پشتیبانی قابل مشاهده خواهد بود.
        </p>
      </Card>

      {/* Total + submit */}
      <Card className="p-5 sm:p-6">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">جمع کل سفارش</span>
            <span className="tnum font-medium tabular-nums text-foreground">
              {formatToman(grossTotal)} <span className="text-xs text-muted-foreground">ت</span>
            </span>
          </div>
          {hasDiscount && (
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Ticket className="h-3.5 w-3.5" />
                تخفیف ({promoApplied?.code})
              </span>
              <span className="tnum font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                −{formatToman(promoApplied!.discount)} <span className="text-xs">ت</span>
              </span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-3">
            <span className="text-sm font-medium text-foreground">مبلغ قابل پرداخت</span>
            <div className="text-end">
              <span className="tnum text-2xl font-bold tabular-nums text-primary">
                {formatToman(total)}
              </span>
              <span className="mr-1 text-xs text-muted-foreground">تومان</span>
            </div>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={onSubmit}
          disabled={submitting || isLoading || !balanceOk}
          className="mt-4 h-12 w-full gap-2 text-sm font-semibold shadow-soft"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال ثبت سفارش…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              پرداخت از کیف پول و ثبت سفارش
            </>
          )}
        </Button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          پرداخت از طریق کیف پول و با رمزنگاری کامل انجام می‌شود.
        </p>
      </Card>
    </div>
  );
}

/* ------------------------------ Success step ----------------------------- */

function SuccessStep({
  tier,
  result,
}: {
  tier: OrderFlowTierData;
  result: SubmitResult;
}) {
  const insufficient = result.insufficient;
  return (
    <div className="space-y-5">
      <Card
        className={cn(
          "relative overflow-hidden p-8 text-center sm:p-10",
          insufficient ? "border-amber-500/30" : "border-emerald-500/30"
        )}
      >
        {/* Soft halo */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 -top-32 mx-auto h-64 w-64 rounded-full blur-3xl",
            insufficient ? "bg-amber-500/15" : "bg-emerald-500/20"
          )}
          aria-hidden
        />

        <div className="relative">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            className={cn(
              "mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full",
              insufficient
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            {insufficient ? (
              <AlertCircle className="h-9 w-9" />
            ) : (
              <PartyPopper className="h-9 w-9" />
            )}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-2xl font-bold text-foreground"
          >
            {insufficient ? "سفارش ثبت شد — در انتظار شارژ" : "سفارش با موفقیت ثبت شد!"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground"
          >
            {insufficient
              ? "سفارش شما در وضعیت «در انتظار پرداخت» ثبت شد. برای فعال‌سازی، کیف پول خود را شارژ کنید تا سفارش به‌طور خودکار اجرا شود."
              : "پرداخت از کیف پول شما کسر و سفارش به صف ارسال منتقل شد. می‌توانید وضعیت آن را به‌صورت لحظه‌ای پیگیری کنید."}
          </motion.p>

          {/* Order code */}
          {result.orderCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mx-auto mt-6 inline-flex flex-col items-center gap-1 rounded-2xl border border-border bg-muted/40 px-6 py-4"
            >
              <span className="text-[11px] text-muted-foreground">کد رهگیری سفارش</span>
              <span className="tnum text-2xl font-bold tabular-nums tracking-wider text-foreground sm:text-3xl">
                {result.orderCode}
              </span>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Summary card */}
      <Card className="p-5 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">خلاصه سفارش</h3>
        <div className="space-y-2.5 text-sm">
          <Row label="سرویس">
            <span className="flex items-center gap-1.5">
              <span className="text-base">{tier.serviceEmoji}</span>
              {tier.serviceName}
            </span>
          </Row>
          <Row label="سطح">
            <TierBadge tier={tier.tier} size="sm" />
          </Row>
          <Row label="تعداد">
            <span className="tnum font-medium tabular-nums">
              {formatQuantity(tier.quantity)}
            </span>
          </Row>
          <Row label="مبلغ">
            <span className="tnum font-bold tabular-nums text-primary">
              {formatToman(result.totalAmount ?? tier.totalAmount)} تومان
            </span>
          </Row>
        </div>
      </Card>

      {/* Insufficient funds CTA */}
      {insufficient && (
        <Alert className="border-amber-500/30 bg-amber-500/8 text-amber-800 dark:text-amber-300">
          <Wallet className="h-4 w-4" />
          <AlertTitle>شارژ کیف پول برای فعال‌سازی سفارش</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>
              پس از شارژ کیف پول به مبلغ کافی، سفارش به‌طور خودکار فعال و وارد
              صف اجرا می‌شود — نیازی به ثبت مجدد نیست.
            </span>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="gap-1.5">
                <Link href={`/wallet?amount=${Math.max(0, (result.totalAmount ?? tier.totalAmount))}`}>
                  <Wallet className="h-3.5 w-3.5" />
                  شارژ کیف پول
                </Link>
              </Button>
              {result.orderId && (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link href={`/orders/${result.orderId}`}>
                    مشاهده سفارش
                    <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
                  </Link>
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
        {result.orderId && !insufficient && (
          <Button asChild size="lg" className="gap-1.5 shadow-soft">
            <Link href={`/orders/${result.orderId}`}>
              <CheckCircle2 className="h-4 w-4" />
              مشاهده سفارش
            </Link>
          </Button>
        )}
        <Button asChild size="lg" variant="outline" className="gap-1.5">
          <Link href="/">
            <Home className="h-4 w-4" />
            بازگشت به خانه
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{children}</span>
    </div>
  );
}
