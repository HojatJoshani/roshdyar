"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TierBadge } from "@/components/brand/tier-badge";
import { StatusBadge } from "@/components/brand/status-badge";
import { toast } from "sonner";
import {
  PLATFORM_META,
  CATEGORY_META,
  type Tier,
  type Platform,
  type Category,
  type OrderStatus,
} from "@/lib/constants";
import {
  formatToman,
  formatQuantity,
  formatRelativeTime,
  toFaDigits,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  PackageOpen,
  Plus,
  ArrowLeft,
  Clock,
  Hash,
  Ticket,
  RefreshCw,
  Loader2,
} from "lucide-react";

export interface OrderRowData {
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
  status: OrderStatus;
  completedCount: number;
  createdAt: string;
}

type FilterKey = "all" | "in_progress" | "completed" | "failed";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "in_progress", label: "در حال انجام" },
  { key: "completed", label: "تکمیل شده" },
  { key: "failed", label: "ناموفق" },
];

function statusMatches(status: OrderStatus, f: FilterKey): boolean {
  if (f === "all") return true;
  if (f === "in_progress")
    return (
      status === "PENDING" ||
      status === "PAYMENT_CONFIRMED" ||
      status === "PROCESSING" ||
      status === "IN_PROGRESS"
    );
  if (f === "completed") return status === "COMPLETED";
  if (f === "failed") return status === "FAILED" || status === "PARTIAL";
  return true;
}

export function OrdersList({ orders }: { orders: OrderRowData[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () => orders.filter((o) => statusMatches(o.status, filter)),
    [orders, filter]
  );

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: orders.length,
      in_progress: 0,
      completed: 0,
      failed: 0,
    };
    for (const o of orders) {
      if (statusMatches(o.status, "in_progress")) c.in_progress++;
      if (statusMatches(o.status, "completed")) c.completed++;
      if (statusMatches(o.status, "failed")) c.failed++;
    }
    return c;
  }, [orders]);

  if (orders.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      {/* Filter chips */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
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
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-soft"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums transition-colors",
                  active ? "bg-primary-foreground/20" : "bg-muted"
                )}
              >
                {toFaDigits(count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            سفارشی در این دسته نیست.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence initial={false}>
            {filtered.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: OrderRowData }) {
  const platformMeta =
    PLATFORM_META[order.platform as Platform] ??
    ({ label: order.platform, emoji: "📦", color: "#64748b" } as const);
  const categoryMeta =
    CATEGORY_META[order.category as Category] ??
    ({ label: order.category, emoji: "📦" } as const);

  const pulse =
    order.status === "IN_PROGRESS" || order.status === "PROCESSING";

  // Truncate link for display
  const linkDisplay = order.targetLink.replace(/^https?:\/\//, "");
  const linkShort =
    linkDisplay.length > 38 ? `${linkDisplay.slice(0, 36)}…` : linkDisplay;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="group relative block rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft sm:p-5">
        {/* Stretched link overlay — covers the whole card except elements with relative z */}
        <Link
          href={`/orders/${order.id}`}
          className="absolute inset-0 z-[1] rounded-2xl"
          aria-label={`مشاهده سفارش ${order.code}`}
        />
        <div className="relative z-[2] flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Left: emoji + service + tier + code */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-xl">
              {order.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {order.serviceName}
                </h3>
                <TierBadge tier={order.tier} size="sm" />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  <span className="tnum font-medium tabular-nums">
                    {order.code}
                  </span>
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span
                  className="inline-flex items-center gap-1"
                  style={{ color: platformMeta.color }}
                >
                  {platformMeta.emoji} {platformMeta.label}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span>{categoryMeta.emoji} {categoryMeta.label}</span>
              </div>
            </div>
          </div>

          {/* Middle: quantity + target link */}
          <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>تعداد:</span>
              <span className="tnum font-medium tabular-nums text-foreground">
                {formatQuantity(order.quantity)}
              </span>
            </div>
            <a
              href={order.targetLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              dir="ltr"
              className="relative z-[3] inline-flex max-w-[180px] items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:max-w-[220px]"
              title={order.targetLink}
            >
              <span className="truncate">{linkShort}</span>
              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
            </a>
          </div>

          {/* Right: status + total + time */}
          <div className="flex shrink-0 flex-col items-end gap-1.5 border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0">
            <StatusBadge status={order.status} pulse={pulse} size="sm" />
            <div className="text-end">
              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="flex flex-col items-end">
                  <span className="tnum text-[10px] tabular-nums text-muted-foreground line-through">
                    {formatToman(order.totalAmount + order.discountAmount)}
                  </span>
                  <span className="tnum text-sm font-bold tabular-nums text-foreground">
                    {formatToman(order.totalAmount)}
                    <span className="mr-1 text-[10px] text-muted-foreground">ت</span>
                  </span>
                </div>
              ) : (
                <span className="tnum text-sm font-bold tabular-nums text-foreground">
                  {formatToman(order.totalAmount)}
                  <span className="mr-1 text-[10px] text-muted-foreground">ت</span>
                </span>
              )}
            </div>
            {order.discountAmount && order.discountAmount > 0 && order.promoCode && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-400">
                <Ticket className="h-2.5 w-2.5" />
                {order.promoCode}
              </span>
            )}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {formatRelativeTime(order.createdAt)}
            </div>
          </div>
        </div>

        {/* Hover affordance + quick re-order */}
        <div className="relative z-[3] mt-2 flex items-center justify-between">
          <ReorderInlineButton orderId={order.id} code={order.code} />
          <span className="flex items-center gap-0.5 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            مشاهده جزئیات
            <ArrowLeft className="h-3 w-3 rtl-flip" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 px-6 py-20 text-center">
      <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl">
        📦
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        هنوز سفارشی ثبت نکرده‌اید
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        اولین سفارش خود را ثبت کنید و در این صفحه رهگیری لحظه‌ای وضعیت آن را
        تجربه کنید.
      </p>
      <Link
        href="/services/instagram"
        className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        اولین سفارش خود را ثبت کنید
      </Link>
    </div>
  );
}

function ReorderInlineButton({ orderId, code }: { orderId: string; code: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const r = await fetch(`/api/orders/${orderId}/reorder`);
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        toast.error(d?.message ?? "امکان سفارش مجدد نیست.");
        return;
      }
      toast.success("در حال انتقال به صفحه سفارش...");
      router.push(d.redirectUrl);
    } catch {
      toast.error("خطای شبکه.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <RefreshCw className="h-3 w-3" />
      )}
      سفارش مجدد
    </button>
  );
}
