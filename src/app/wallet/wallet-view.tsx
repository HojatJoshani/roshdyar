"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatToman,
  formatRelativeTime,
  formatDateTime,
  toFaDigits,
  toEnDigits,
} from "@/lib/format";
import {
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Settings,
  Wallet as WalletIcon,
  Plus,
  Loader2,
  CreditCard,
  ShieldCheck,
  Hash,
  Receipt,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export type WalletTxRow = {
  id: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number;
  type: "DEPOSIT" | "ORDER_PAYMENT" | "REFUND" | "ADMIN_ADJUST";
  description: string;
  reference: string | null;
  orderId: string | null;
  createdAt: string;
};

type FilterKey = "all" | "CREDIT" | "DEBIT";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "CREDIT", label: "واریز" },
  { key: "DEBIT", label: "برداشت" },
];

const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000, 1_000_000];

const MIN_AMOUNT = 10_000;
const MAX_AMOUNT = 50_000_000;

// Per-type meta (icon + bg + label)
const TYPE_META: Record<
  WalletTxRow["type"],
  {
    Icon: typeof ArrowDownLeft;
    iconBg: string;
    iconColor: string;
    label: string;
  }
> = {
  DEPOSIT: {
    Icon: ArrowDownLeft,
    iconBg: "bg-emerald-500/12",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    label: "واریز",
  },
  ORDER_PAYMENT: {
    Icon: ArrowUpRight,
    iconBg: "bg-primary/12",
    iconColor: "text-primary",
    label: "پرداخت سفارش",
  },
  REFUND: {
    Icon: RotateCcw,
    iconBg: "bg-amber-500/12",
    iconColor: "text-amber-700 dark:text-amber-400",
    label: "بازگشت وجه",
  },
  ADMIN_ADJUST: {
    Icon: Settings,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    label: "تعدیل",
  },
};

export function WalletView({
  initialBalance,
  transactions,
  initialDepositOpen = false,
}: {
  initialBalance: number;
  transactions: WalletTxRow[];
  initialDepositOpen?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  // Keep balance live via React Query (initial from SSR)
  const { balance } = useWalletBalance();
  const liveBalance = balance ?? initialBalance;

  const [filter, setFilter] = useState<FilterKey>("all");
  const [depositOpen, setDepositOpen] = useState(initialDepositOpen);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? transactions
        : transactions.filter((t) => t.direction === filter),
    [transactions, filter]
  );

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: transactions.length,
      CREDIT: 0,
      DEBIT: 0,
    };
    for (const t of transactions) c[t.direction]++;
    return c;
  }, [transactions]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-mesh-brand p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <WalletIcon className="h-4 w-4 text-primary" />
            موجودی فعلی
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="tnum text-4xl font-extrabold tabular-nums leading-none tracking-tight text-foreground sm:text-5xl">
              {formatToman(liveBalance)}
            </span>
            <span className="mb-1 text-sm font-medium text-muted-foreground">
              تومان
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            به‌روزرسانی لحظه‌ای — برای استفاده در سفارش‌ها
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              size="lg"
              onClick={() => setDepositOpen(true)}
              className="h-11 gap-2 rounded-xl px-5 text-sm font-semibold shadow-soft"
            >
              <Plus className="h-4 w-4" />
              شارژ کیف پول
            </Button>
            <Link
              href="/orders"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card/70 px-4 text-sm font-medium text-foreground backdrop-blur transition-colors hover:border-primary/40 hover:bg-card"
            >
              <Receipt className="h-4 w-4 text-muted-foreground" />
              سفارش‌های من
            </Link>
          </div>
        </div>
      </div>

      {/* Deposit dialog */}
      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        router={router}
        toast={toast}
      />

      {/* Transactions header + filter */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            تراکنش‌ها
          </h2>
          <div className="flex items-center gap-1.5">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count = counts[f.key];
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-soft"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      active ? "bg-primary-foreground/20" : "bg-muted"
                    )}
                  >
                    {toFaDigits(count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {transactions.length === 0 ? (
          <EmptyTransactions onCharge={() => setDepositOpen(true)} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 px-6 py-12 text-center text-sm text-muted-foreground">
            تراکنشی در این دسته نیست.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <AnimatePresence initial={false} mode="popLayout">
              {filtered.map((t, i) => (
                <TxRow key={t.id} tx={t} isLast={i === filtered.length - 1} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        تمام تراکنش‌ها از طریق درگاه زرین‌پال پردازش می‌شوند.
      </p>
    </div>
  );
}

// ---------- Transaction row ----------

function TxRow({ tx, isLast }: { tx: WalletTxRow; isLast: boolean }) {
  const meta = TYPE_META[tx.type] ?? TYPE_META.ADMIN_ADJUST;
  const Icon = meta.Icon;
  const isCredit = tx.direction === "CREDIT";
  const signedAmount = (isCredit ? "+" : "−") + formatToman(tx.amount);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 sm:px-5 sm:py-4",
        !isLast && "border-b border-border/60"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          meta.iconBg
        )}
      >
        <Icon className={cn("h-5 w-5", meta.iconColor)} />
      </div>

      {/* Description + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">
            {tx.description}
          </span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {meta.label}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span title={formatDateTime(tx.createdAt)}>
            {formatRelativeTime(tx.createdAt)}
          </span>
          {tx.orderId && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <Link
                href={`/orders/${tx.orderId}`}
                className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                مشاهده سفارش
              </Link>
            </>
          )}
          {tx.reference && !tx.orderId && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <span className="inline-flex items-center gap-0.5 font-mono">
                <Hash className="h-2.5 w-2.5" />
                {tx.reference.slice(0, 12)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          className={cn(
            "tnum text-sm font-bold tabular-nums",
            isCredit
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          {signedAmount}
        </span>
        <span className="text-[10px] text-muted-foreground">
          <span className="tnum tabular-nums">{formatToman(tx.balanceAfter)}</span>{" "}
          موجودی
        </span>
      </div>
    </motion.div>
  );
}

// ---------- Deposit dialog ----------

function DepositDialog({
  open,
  onOpenChange,
  router,
  toast,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  router: ReturnType<typeof useRouter>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [amountStr, setAmountStr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setAmountStr(""), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Parse Persian digits + non-digits strip
  const numericAmount = (() => {
    const en = toEnDigits(amountStr).replace(/[^\d]/g, "");
    return en ? parseInt(en, 10) : 0;
  })();

  const validationError = useMemo(() => {
    if (!amountStr) return null;
    if (numericAmount < MIN_AMOUNT)
      return `حداقل مبلغ شارژ ${formatToman(MIN_AMOUNT)} تومان است.`;
    if (numericAmount > MAX_AMOUNT)
      return `حداکثر مبلغ شارژ ${formatToman(MAX_AMOUNT)} تومان است.`;
    return null;
  }, [amountStr, numericAmount]);

  const canSubmit = numericAmount >= MIN_AMOUNT && numericAmount <= MAX_AMOUNT && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg =
          data?.error === "INVALID_INPUT"
            ? "مبلغ واردشده نامعتبر است."
            : "در شروع پرداخت خطایی رخ داد. لطفاً دوباره تلاش کنید.";
        toast({
          title: "خطا در شارژ کیف پول",
          description: msg,
          variant: "destructive",
        });
        return;
      }
      // redirectUrl is relative — push to the mock gateway callback
      if (data?.redirectUrl) {
        router.push(data.redirectUrl);
      }
    } catch {
      toast({
        title: "خطای شبکه",
        description: "اتصال به سرور ناموفق بود.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-4 w-4" />
            </span>
            شارژ کیف پول
          </DialogTitle>
          <DialogDescription>
            مبلغ موردنظر را وارد کنید. پرداخت از طریق درگاه زرین‌پال انجام
            می‌شود.
          </DialogDescription>
        </DialogHeader>

        {/* Amount input */}
        <div className="space-y-2.5">
          <div className="relative">
            <Input
              inputMode="numeric"
              dir="ltr"
              value={amountStr}
              onChange={(e) => {
                // accept Persian/Latin digits only, strip non-digits
                const en = toEnDigits(e.target.value).replace(/[^\d]/g, "");
                // format with thousands separators for display
                if (!en) {
                  setAmountStr("");
                } else {
                  setAmountStr(Number(en).toLocaleString("en-US"));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) handleSubmit();
              }}
              placeholder="0"
              className={cn(
                "h-14 text-2xl font-bold tabular-nums text-left pl-14",
                validationError && "border-destructive/60 focus-visible:ring-destructive/20"
              )}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
              تومان
            </span>
          </div>

          {/* Quick amount chips */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_AMOUNTS.map((amt) => {
              const active = numericAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountStr(amt.toLocaleString("en-US"))}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium tabular-nums transition-all",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {toFaDigits(amt.toLocaleString("en-US"))}
                </button>
              );
            })}
          </div>

          {/* Validation message */}
          <div className="min-h-[1.25rem] text-xs">
            {validationError ? (
              <span className="inline-flex items-center gap-1 text-destructive">
                <AlertCircle className="h-3 w-3" />
                {validationError}
              </span>
            ) : numericAmount > 0 ? (
              <span className="text-muted-foreground">
                مبلغ نهایی:{" "}
                <span className="tnum font-semibold tabular-nums text-foreground">
                  {formatToman(numericAmount)}
                </span>{" "}
                تومان
              </span>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="h-11"
          >
            انصراف
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-11 flex-1 gap-2 font-semibold shadow-soft"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال انتقال به درگاه…
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                پرداخت از درگاه زرین‌پال
              </>
            )}
          </Button>
        </DialogFooter>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-primary" />
          اتصال امن از طریق SSL — اطلاعات کارت ذخیره نمی‌شود.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Empty state ----------

function EmptyTransactions({ onCharge }: { onCharge: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl">
        💳
      </div>
      <h3 className="text-base font-semibold text-foreground">
        هنوز تراکنشی ندارید
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        با شارژ اولیه کیف پول، می‌توانید سفارش‌ها را سریع‌تر ثبت کنید و
        تاریخچه تراکنش‌های خود را اینجا ببینید.
      </p>
      <Button
        type="button"
        onClick={onCharge}
        className="mt-6 h-11 gap-2 px-5 shadow-soft"
      >
        <Plus className="h-4 w-4" />
        شارژ کیف پول
      </Button>
    </div>
  );
}
