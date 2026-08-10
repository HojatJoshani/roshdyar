"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  formatRelativeTime,
  formatDateTime,
  toFaDigits,
} from "@/lib/format";
import {
  MessageSquare,
  Plus,
  Reply,
  Clock,
  Hash,
  MessageCircle,
  ChevronLeft,
  PackageSearch,
  CreditCard,
  Tag,
} from "lucide-react";

export type TicketRow = {
  id: string;
  code: string;
  subject: string;
  category: "general" | "order" | "payment" | "other";
  status: "OPEN" | "ANSWERED" | "CLOSED";
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  lastReplyAt: string | null;
  lastReplyIsStaff: boolean;
};

type FilterKey = "all" | "OPEN" | "ANSWERED" | "CLOSED";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "OPEN", label: "باز" },
  { key: "ANSWERED", label: "پاسخ داده شده" },
  { key: "CLOSED", label: "بسته" },
];

const STATUS_META: Record<
  TicketRow["status"],
  { label: string; dot: string; chip: string }
> = {
  OPEN: {
    label: "باز",
    dot: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
  },
  ANSWERED: {
    label: "پاسخ داده شده",
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  },
  CLOSED: {
    label: "بسته شده",
    dot: "bg-muted-foreground",
    chip: "bg-muted text-muted-foreground border-border",
  },
};

const CATEGORY_META: Record<
  TicketRow["category"],
  { label: string; Icon: typeof Tag }
> = {
  general: { label: "عمومی", Icon: Tag },
  order: { label: "سفارش", Icon: PackageSearch },
  payment: { label: "پرداخت", Icon: CreditCard },
  other: { label: "سایر", Icon: MessageCircle },
};

export function SupportList({ tickets }: { tickets: TicketRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: tickets.length,
      OPEN: 0,
      ANSWERED: 0,
      CLOSED: 0,
    };
    for (const t of tickets) c[t.status]++;
    return c;
  }, [tickets]);

  const filtered = useMemo(
    () => (filter === "all" ? tickets : tickets.filter((t) => t.status === filter)),
    [tickets, filter]
  );

  if (tickets.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      {/* Header row with new ticket button + filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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

        <Link
          href="/support/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          تیکت جدید
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/30 px-6 py-12 text-center text-sm text-muted-foreground">
          تیکتی در این دسته نیست.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence initial={false}>
            {filtered.map((t) => (
              <TicketRowCard key={t.id} ticket={t} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function TicketRowCard({ ticket }: { ticket: TicketRow }) {
  const status = STATUS_META[ticket.status];
  const cat = CATEGORY_META[ticket.category];
  const CatIcon = cat.Icon;
  const pulse = ticket.status === "OPEN";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <Link
        href={`/support/${ticket.id}`}
        className="group block rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Left: subject + meta */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"
              )}
            >
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {ticket.subject}
                </h3>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-mono">
                  <Hash className="h-3 w-3" />
                  <span className="tnum font-medium tabular-nums">
                    {ticket.code}
                  </span>
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="inline-flex items-center gap-1">
                  <CatIcon className="h-3 w-3" />
                  {cat.label}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span
                  className="inline-flex items-center gap-1"
                  title={formatDateTime(ticket.createdAt)}
                >
                  <Clock className="h-2.5 w-2.5" />
                  {formatRelativeTime(ticket.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: reply count + last activity + status */}
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                <Reply className="h-2.5 w-2.5" />
                <span className="tnum tabular-nums">{toFaDigits(ticket.replyCount)}</span>
                <span>پاسخ</span>
              </div>
              {ticket.lastReplyAt && (
                <span
                  className="hidden text-[11px] text-muted-foreground sm:inline"
                  title={formatDateTime(ticket.lastReplyAt)}
                >
                  آخرین فعالیت {formatRelativeTime(ticket.lastReplyAt)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                  status.chip
                )}
              >
                <span className="relative flex h-1.5 w-1.5">
                  {pulse && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                  )}
                  <span
                    className={cn(
                      "relative inline-flex h-1.5 w-1.5 rounded-full",
                      status.dot
                    )}
                  />
                </span>
                {status.label}
              </span>
              <ChevronLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* Hover affordance */}
        <div className="mt-2 flex items-center justify-end text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          مشاهده گفتگو
          <ChevronLeft className="h-3 w-3" />
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 px-6 py-20 text-center">
      <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl">
        💬
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        هنوز تیکتی ندارید
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        اگر سؤالی دارید یا با مشکلی مواجه شدید، اولین تیکت خود را ارسال کنید.
        تیم پشتیبانی رشدیار پاسخگوی شما خواهد بود.
      </p>
      <Link
        href="/support/new"
        className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        ارسال اولین تیکت
      </Link>
    </div>
  );
}
