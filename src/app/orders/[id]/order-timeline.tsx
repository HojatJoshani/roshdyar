"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TierBadge } from "@/components/brand/tier-badge";
import { StatusBadge } from "@/components/brand/status-badge";
import { OrderProgress } from "@/components/brand/order-progress";
import {
  STATUS_META,
  ORDER_STATUS_FLOW,
  PLATFORM_META,
  CATEGORY_META,
  type Tier,
  type Platform,
  type Category,
  type OrderStatus,
  type StatusMeta,
} from "@/lib/constants";
import {
  formatToman,
  formatQuantity,
  formatRelativeTime,
  formatDateTime,
  toFaDigits,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Hash,
  LifeBuoy,
  Link2,
  Loader2,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Wallet,
  ShoppingBag,
  Star,
  ChevronDown,
  Code,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface OrderEventItem {
  id: string;
  status: OrderStatus;
  message: string;
  createdAt: string;
}

export interface OrderDetailData {
  id: string;
  code: string;
  serviceName: string;
  serviceSlug: string;
  platform: string;
  category: string;
  tier: Tier;
  tierDisplay: string;
  emoji: string;
  quantity: number;
  unitPricePer1000: number;
  totalAmount: number;
  discountAmount?: number | null;
  promoCode?: string | null;
  targetLink: string;
  notes: string | null;
  status: OrderStatus;
  startedCount: number;
  remainsCount: number;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
  events: OrderEventItem[];
  // Admin-only fields — only populated when isAdmin is true
  providerOrderId?: string | null;
  providerMeta?: string | null;
}

interface Step {
  status: OrderStatus;
  meta: StatusMeta;
  isOutcome: boolean; // PARTIAL / FAILED
  isCompleted: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  event?: OrderEventItem;
}

export function OrderTimeline({
  order,
  supportHref,
  isAdmin = false,
  relatedOrders = [],
}: {
  order: OrderDetailData;
  supportHref: string;
  isAdmin?: boolean;
  relatedOrders?: Array<{
    id: string;
    code: string;
    serviceName: string;
    emoji: string;
    status: OrderStatus;
    totalAmount: number;
    createdAt: string;
  }>;
}) {
  const platformMeta =
    PLATFORM_META[order.platform as Platform] ??
    ({ label: order.platform, emoji: "📦", color: "#64748b" } as const);
  const categoryMeta =
    CATEGORY_META[order.category as Category] ??
    ({ label: order.category, emoji: "📦" } as const);

  // Build a status → latest-event map (use the last event for each status)
  const eventsByStatus = new Map<OrderStatus, OrderEventItem>();
  for (const e of order.events) {
    eventsByStatus.set(e.status, e); // events are sorted asc, so last wins
  }

  const currentStep = STATUS_META[order.status].step;
  const isOutcome = order.status === "PARTIAL" || order.status === "FAILED";

  // Build steps array
  const steps: Step[] = ORDER_STATUS_FLOW.map((status) => {
    const meta = STATUS_META[status];
    const isCurrent = status === order.status;
    const isCompleted = !isCurrent && meta.step < currentStep;

    // For PARTIAL/FAILED, the COMPLETED step should not be shown as completed
    const isFuture = meta.step > currentStep;

    return {
      status,
      meta,
      isOutcome: false,
      isCompleted: isOutcome ? false : isCompleted,
      isCurrent,
      isFuture,
      event: eventsByStatus.get(status),
    };
  });

  // Replace COMPLETED with outcome if needed.
  if (isOutcome) {
    const outcomeMeta = STATUS_META[order.status];
    steps[steps.length - 1] = {
      status: order.status,
      meta: outcomeMeta,
      isOutcome: true,
      isCompleted: false,
      isCurrent: true,
      isFuture: false,
      event: eventsByStatus.get(order.status),
    };
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4 rtl-flip" />
            بازگشت به سفارش‌ها
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="tnum text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {order.code}
            </h1>
            <StatusBadge
              status={order.status}
              pulse={order.status === "IN_PROGRESS" || order.status === "PROCESSING"}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {order.serviceName}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(order.createdAt)}
            </span>
          </div>
        </div>

        {/* Quick action chips */}
        <div className="flex items-center gap-2">
          <ReorderButton orderId={order.id} />
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={supportHref}>
              <LifeBuoy className="h-3.5 w-3.5" />
              پشتیبانی این سفارش
            </Link>
          </Button>
        </div>
      </div>

      {/* 2-col: summary (right, 40%) + timeline (left, 60%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
        {/* Summary */}
        <div className="order-1 lg:order-1">
          <SummaryCard
            order={order}
            platformMeta={platformMeta}
            categoryMeta={categoryMeta}
            isAdmin={isAdmin}
          />
        </div>

        {/* Timeline */}
        <div className="order-2 lg:order-2">
          <TimelineCard steps={steps} order={order} />
        </div>
      </div>

      {/* Provider debug — admin only */}
      {isAdmin && (order.providerOrderId || order.providerMeta) && (
        <ProviderDebugCard
          providerOrderId={order.providerOrderId ?? null}
          providerMeta={order.providerMeta ?? null}
        />
      )}

      {/* Notes section */}
      {order.notes && (
        <Card className="mt-6 p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-foreground">
              <StickyNote className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">نظرات و یادداشت</h3>
              <p className="text-xs text-muted-foreground">یادداشت شما هنگام ثبت سفارش</p>
            </div>
          </div>
          <p className="rounded-lg bg-muted/40 px-4 py-3 text-sm leading-7 text-foreground">
            {order.notes}
          </p>
        </Card>
      )}

      {/* Leave a review CTA — only for COMPLETED orders */}
      {order.status === "COMPLETED" && (
        <Card className="mt-6 border-amber-500/25 bg-amber-500/[0.03] p-5 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                <Star className="h-5 w-5 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  نظر خود را ثبت کنید
                </h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  تجربه خود را از این سرویس با دیگران به اشتراک بگذارید.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="gap-1.5 border-amber-500/40 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300">
              <Link href={`/services/${order.serviceSlug}?tab=reviews`}>
                <Star className="h-4 w-4" />
                ثبت نظر
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Related orders */}
      {relatedOrders.length > 0 && (
        <Card className="mt-6 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-foreground">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {isAdmin ? "سایر سفارش‌های این کاربر" : "سایر سفارش‌های این سرویس"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {relatedOrders.length} سفارش دیگر
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {relatedOrders.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
              >
                <Link
                  href={`/orders/${o.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/40 hover:bg-accent/30"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-base">
                    {o.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {o.serviceName}
                      </span>
                      <span className="tnum text-[11px] tabular-nums text-muted-foreground">
                        {o.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(o.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={o.status} size="sm" />
                  <span className="tnum text-sm font-bold tabular-nums text-foreground">
                    {formatToman(o.totalAmount)}
                    <span className="mr-1 text-[10px] text-muted-foreground">ت</span>
                  </span>
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary rtl-flip" />
                </Link>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Support CTA at bottom */}
      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">پشتیبانی این سفارش</h3>
              <p className="text-xs leading-5 text-muted-foreground">
                اگر در مورد این سفارش سؤالی دارید یا مشکلی پیش آمده، تیم پشتیبانی
                آماده پاسخگویی است.
              </p>
            </div>
          </div>
          <Button asChild className="gap-1.5 shadow-soft">
            <Link href={supportHref}>
              <MessageSquare className="h-4 w-4" />
              باز کردن تیکت پشتیبانی
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------- Summary card ----------------------------- */

function SummaryCard({
  order,
  platformMeta,
  categoryMeta,
  isAdmin = false,
}: {
  order: OrderDetailData;
  platformMeta: { label: string; emoji: string; color: string };
  categoryMeta: { label: string; emoji: string };
  isAdmin?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const router = useRouter();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(order.targetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — clipboard may not be available
    }
  };

  const isPartial = order.status === "PARTIAL";
  const isFailed = order.status === "FAILED";
  const canRefund = isAdmin && (isPartial || isFailed);
  const refundAmount =
    isPartial && order.completedCount < order.quantity
      ? Math.round(
          ((order.quantity - order.completedCount) / 1000) *
            order.unitPricePer1000
        )
      : isFailed
        ? order.totalAmount
        : 0;

  const handleRefund = async () => {
    if (!canRefund) return;
    if (!confirm("از بازگشت وجه این سفارش مطمئن هستید؟")) return;
    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.message || "بازگشت وجه ناموفق بود.");
        return;
      }
      if (body.alreadyRefunded) {
        toast.info("این سفارش قبلاً بازگشت وجه شده است.");
      } else {
        toast.success(
          `${formatToman(body.amount)} تومان به کیف پول کاربر بازگردانده شد.`
        );
      }
      router.refresh();
    } catch {
      toast.error("خطای شبکه.");
    } finally {
      setRefunding(false);
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      {/* Service header */}
      <div className="relative border-b border-border/60 bg-gradient-to-l from-primary/5 via-transparent to-transparent p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-2xl">
            {order.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground">
              {order.serviceName}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
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
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                {categoryMeta.emoji} {categoryMeta.label}
              </span>
              <TierBadge tier={order.tier} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="divide-y divide-border/60">
        <SummaryRow label="تعداد سفارش">
          <span className="tnum font-semibold tabular-nums text-foreground">
            {formatQuantity(order.quantity)}
          </span>
        </SummaryRow>
        <SummaryRow label="قیمت هر ۱٬۰۰۰">
          <span className="tnum font-medium tabular-nums text-foreground">
            {formatToman(order.unitPricePer1000)}{" "}
            <span className="text-[10px] text-muted-foreground">ت</span>
          </span>
        </SummaryRow>
        {order.discountAmount && order.discountAmount > 0 ? (
          <>
            <SummaryRow label="جمع کل">
              <span className="tnum font-medium tabular-nums text-muted-foreground line-through decoration-muted-foreground/50">
                {formatToman(order.totalAmount + order.discountAmount)}
              </span>
            </SummaryRow>
            <SummaryRow label={`تخفیف (${order.promoCode ?? "کد"})`}>
              <span className="tnum font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                −{formatToman(order.discountAmount)}{" "}
                <span className="text-[10px]">ت</span>
              </span>
            </SummaryRow>
            <SummaryRow label="مبلغ نهایی">
              <span className="tnum font-bold tabular-nums text-primary">
                {formatToman(order.totalAmount)}{" "}
                <span className="text-[10px] text-muted-foreground">ت</span>
              </span>
            </SummaryRow>
          </>
        ) : (
          <SummaryRow label="مبلغ کل">
            <span className="tnum font-bold tabular-nums text-primary">
              {formatToman(order.totalAmount)}{" "}
              <span className="text-[10px] text-muted-foreground">ت</span>
            </span>
          </SummaryRow>
        )}
      </div>

      {/* Target link with copy + open */}
      <div className="border-t border-border/60 p-5 sm:p-6">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" />
          لینک هدف
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={order.targetLink}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/40"
            title={order.targetLink}
          >
            <span className="truncate font-mono text-xs text-muted-foreground group-hover:text-foreground">
              {order.targetLink.replace(/^https?:\/\//, "")}
            </span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
          </a>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={copyLink}
            aria-label="کپی لینک"
            className="h-10 w-10 shrink-0"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Times */}
      <div className="border-t border-border/60 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-muted-foreground">تاریخ ثبت</div>
            <div className="tnum mt-0.5 text-xs font-medium tabular-nums text-foreground">
              {formatDateTime(order.createdAt)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">آخرین به‌روزرسانی</div>
            <div className="tnum mt-0.5 text-xs font-medium tabular-nums text-foreground">
              {formatRelativeTime(order.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="border-t border-border/60 p-5 sm:p-6">
        <OrderProgress
          completedCount={order.completedCount}
          quantity={order.quantity}
          status={order.status}
        />

        {isPartial && refundAmount > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300">
            <RefreshCw className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              بخشی از سفارش انجام شد.{" "}
              <span className="tnum font-semibold tabular-nums">
                {formatQuantity(order.quantity - order.completedCount)}
              </span>{" "}
              واحد انجام نشده و معادل{" "}
              <span className="tnum font-semibold tabular-nums">
                {formatToman(refundAmount)}
              </span>{" "}
              تومان به کیف پول شما بازمی‌گردد.
            </span>
          </div>
        )}

        {order.status === "FAILED" && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/8 px-3 py-2 text-[11px] text-red-700 dark:text-red-300">
            <RefreshCw className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              سفارش ناموفق بود. کل مبلغ (
              <span className="tnum font-semibold tabular-nums">
                {formatToman(order.totalAmount)}
              </span>{" "}
              تومان) به کیف پول شما بازگردانده می‌شود.
            </span>
          </div>
        )}

        {/* Admin manual refund action */}
        {canRefund && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-start gap-2">
              <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  عملیات مدیریت
                </div>
                <p className="mt-0.5 text-[11px] leading-5 text-amber-700/90 dark:text-amber-400/80">
                  بازگشت وجه دستی به مبلغ{" "}
                  <span className="tnum font-bold tabular-nums">
                    {formatToman(refundAmount)}
                  </span>{" "}
                  تومان به کیف پول کاربر.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRefund}
                  disabled={refunding}
                  className="mt-2 h-8 gap-1.5 border-amber-500/40 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-300 dark:hover:bg-amber-500/15"
                >
                  {refunding ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  بازگشت وجه
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

/* ------------------------------ Timeline card ---------------------------- */

const TONE_DOT: Record<StatusMeta["tone"], string> = {
  neutral: "bg-muted-foreground/40",
  info: "bg-primary",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  danger: "bg-red-500",
};

const TONE_RING: Record<StatusMeta["tone"], string> = {
  neutral: "border-muted-foreground/30 bg-muted/50",
  info: "border-primary/30 bg-primary/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  success: "border-emerald-500/30 bg-emerald-500/10",
  danger: "border-red-500/30 bg-red-500/10",
};

const TONE_TEXT: Record<StatusMeta["tone"], string> = {
  neutral: "text-muted-foreground",
  info: "text-primary",
  warning: "text-amber-600 dark:text-amber-400",
  success: "text-emerald-600 dark:text-emerald-400",
  danger: "text-red-600 dark:text-red-400",
};

function TimelineCard({
  steps,
  order,
}: {
  steps: Step[];
  order: OrderDetailData;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">وضعیت سفارش</h2>
            <p className="text-xs text-muted-foreground">رهگیری لحظه‌ای وضعیت</p>
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {toFaDigits(steps.length)} مرحله
        </span>
      </div>

      {/* Vertical timeline */}
      <div className="relative">
        {steps.map((step, i) => (
          <TimelineRow key={`${step.status}-${i}`} step={step} isLast={i === steps.length - 1} />
        ))}
      </div>
    </Card>
  );
}

function TimelineRow({ step, isLast }: { step: Step; isLast: boolean }) {
  const tone = step.meta.tone;
  const { isCompleted, isCurrent, isFuture, event } = step;

  // Dot logic
  const dotClass = isCompleted
    ? TONE_DOT[tone]
    : isCurrent
      ? TONE_DOT[tone]
      : "bg-muted-foreground/15";

  // Connector line color: emerald/primary if completed, faded if future
  const lineClass = isCompleted ? "bg-primary/30" : "bg-border";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
      className="relative flex gap-3.5 pr-1"
    >
      {/* Dot column + connector */}
      <div className="relative flex flex-col items-center pt-1">
        <div
          className={cn(
            "relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
            isFuture
              ? "border-border bg-background"
              : isCompleted || isCurrent
                ? `${TONE_RING[tone]} border-transparent`
                : "border-border bg-background"
          )}
        >
          {/* Inner solid dot / check / pulse */}
          {isFuture ? (
            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          ) : isCompleted ? (
            <Check className={cn("h-3.5 w-3.5", TONE_TEXT[tone])} strokeWidth={3} />
          ) : isCurrent ? (
            <>
              <span className="absolute inline-flex h-7 w-7 animate-ping rounded-full opacity-30 bg-current" style={{ color: "currentColor" }} />
              <span className={cn("relative h-2.5 w-2.5 rounded-full", dotClass)} />
            </>
          ) : (
            <span className={cn("h-2 w-2 rounded-full", dotClass)} />
          )}
        </div>

        {/* Vertical connector line */}
        {!isLast && (
          <div
            className={cn(
              "mt-1 w-0.5 flex-1",
              isCompleted ? "bg-primary/30" : lineClass
            )}
            style={{ minHeight: 28 }}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-6", isFuture && "opacity-50")}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <h3
            className={cn(
              "text-sm font-semibold",
              isCompleted
                ? TONE_TEXT[tone]
                : isCurrent
                  ? "text-foreground"
                  : "text-muted-foreground"
            )}
          >
            {step.meta.label}
          </h3>
          {event && (
            <span className="tnum text-[10px] text-muted-foreground tabular-nums">
              {formatRelativeTime(event.createdAt)}
            </span>
          )}
        </div>
        <p
          className={cn(
            "mt-1 text-xs leading-6",
            isFuture ? "text-muted-foreground/70" : "text-muted-foreground"
          )}
        >
          {event?.message ?? step.meta.description}
        </p>

        {/* "Current" badge — only for non-terminal in-flight states */}
        {isCurrent && (step.status === "PROCESSING" || step.status === "IN_PROGRESS" || step.status === "PAYMENT_CONFIRMED" || step.status === "PENDING") && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            {step.status === "PENDING" || step.status === "PAYMENT_CONFIRMED" ? "صف انتظار" : "در حال انجام"}
          </span>
        )}
        {isCurrent && (step.status === "COMPLETED" || step.status === "PARTIAL" || step.status === "FAILED") && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            وضعیت نهایی
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------- Reorder button --------------------------- */

function ReorderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`);
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.message || "امکان سفارش مجدد نیست.");
        return;
      }
      toast.success("در حال انتقال به صفحه سفارش...");
      router.push(body.redirectUrl);
    } catch {
      toast.error("خطای شبکه.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5 shadow-soft"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ShoppingBag className="h-3.5 w-3.5" />
      )}
      سفارش مجدد
    </Button>
  );
}

/* --------------------------- Provider debug card -------------------------- */
/* Admin-only — shows the raw provider order ID + provider metadata JSON in a
   collapsible viewer. Useful for debugging order issues with the provider. */

function ProviderDebugCard({
  providerOrderId,
  providerMeta,
}: {
  providerOrderId: string | null;
  providerMeta: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = (() => {
    if (!providerMeta) return null;
    try {
      return JSON.parse(providerMeta);
    } catch {
      return null;
    }
  })();

  const copyOrderId = async () => {
    if (!providerOrderId) return;
    try {
      await navigator.clipboard.writeText(providerOrderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <Card className="mt-6 overflow-hidden p-0 border-amber-500/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-start transition-colors hover:bg-accent/40 sm:p-5"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Code className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              اطلاعات تأمین‌کننده (دیباگ)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              فقط برای مدیر — شناسه و پاسخ خام تأمین‌کننده
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-border/60"
        >
          <div className="space-y-4 p-4 sm:p-5">
            {/* Provider order ID */}
            {providerOrderId && (
              <div>
                <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                  شناسه سفارش نزد تأمین‌کننده
                </div>
                <div className="flex items-center gap-2">
                  <code
                    dir="ltr"
                    className="flex-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 font-mono text-xs text-foreground"
                  >
                    {providerOrderId}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyOrderId}
                    className="h-9 w-9 shrink-0"
                    aria-label="کپی"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Provider meta JSON */}
            {meta && (
              <div>
                <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                  پاسخ خام تأمین‌کننده (JSON)
                </div>
                <pre
                  dir="ltr"
                  className="max-h-64 overflow-auto rounded-lg border border-border/60 bg-muted/30 p-3 text-[11px] leading-5"
                >
                  <code className="font-mono">
                    {JSON.stringify(meta, null, 2)}
                  </code>
                </pre>
              </div>
            )}

            {!providerOrderId && !meta && (
              <p className="py-3 text-center text-xs text-muted-foreground">
                هنوز اطلاعاتی از تأمین‌کننده دریافت نشده است.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </Card>
  );
}
