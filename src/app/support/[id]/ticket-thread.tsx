"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatDateTime, toFaDigits } from "@/lib/format";
import {
  Send,
  Loader2,
  ArrowRight,
  Hash,
  Clock,
  Headphones,
  User as UserIcon,
  PackageSearch,
  CreditCard,
  Tag,
  MessageCircle,
  Lock,
  ChevronLeft,
} from "lucide-react";

export type TicketReply = {
  id: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  userId: string | null;
};

export type TicketData = {
  id: string;
  code: string;
  subject: string;
  category: "general" | "order" | "payment" | "other";
  status: "OPEN" | "ANSWERED" | "CLOSED";
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
};

const STATUS_META: Record<
  TicketData["status"],
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
  TicketData["category"],
  { label: string; Icon: typeof Tag }
> = {
  general: { label: "عمومی", Icon: Tag },
  order: { label: "سفارش", Icon: PackageSearch },
  payment: { label: "پرداخت", Icon: CreditCard },
  other: { label: "سایر", Icon: MessageCircle },
};

export function TicketThread({
  ticket,
  currentUserId,
}: {
  ticket: TicketData;
  currentUserId: string;
}) {
  const { toast } = useToast();
  const [replies, setReplies] = useState<TicketReply[]>(ticket.replies);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [optimisticId, setOptimisticId] = useState<string | null>(null);

  const status = STATUS_META[ticket.status];
  const cat = CATEGORY_META[ticket.category];
  const CatIcon = cat.Icon;
  const isClosed = ticket.status === "CLOSED";

  const threadRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTo({
        top: threadRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [replies.length]);

  // Stable id generator for optimistic entries
  const nextOptimisticId = useMemo(
    () => `opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  async function handleReply() {
    const trimmed = message.trim();
    if (!trimmed) return;
    setSubmitting(true);
    const optId = nextOptimisticId + "-" + replies.length;
    setOptimisticId(optId);

    const optimistic: TicketReply = {
      id: optId,
      message: trimmed,
      isStaff: false,
      createdAt: new Date().toISOString(),
      userId: currentUserId,
    };
    setReplies((prev) => [...prev, optimistic]);
    setMessage("");

    try {
      const r = await fetch(`/api/support/${ticket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        // Roll back optimistic
        setReplies((prev) => prev.filter((x) => x.id !== optId));
        toast({
          title: "خطا در ارسال پاسخ",
          description:
            data?.error === "INVALID_INPUT"
              ? "متن پیام نامعتبر است."
              : "ارسال ناموفق بود. لطفاً دوباره تلاش کنید.",
          variant: "destructive",
        });
        setMessage(trimmed);
        return;
      }
      // Replace optimistic with real reply
      if (data?.reply) {
        setReplies((prev) =>
          prev.map((x) =>
            x.id === optId
              ? {
                  id: data.reply.id,
                  message: data.reply.message,
                  isStaff: data.reply.isStaff,
                  createdAt: data.reply.createdAt,
                  userId: data.reply.userId ?? currentUserId,
                }
              : x
          )
        );
      }
    } catch {
      setReplies((prev) => prev.filter((x) => x.id !== optId));
      toast({
        title: "خطای شبکه",
        description: "اتصال به سرور ناموفق بود.",
        variant: "destructive",
      });
      setMessage(trimmed);
    } finally {
      setSubmitting(false);
      setOptimisticId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href="/support"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="h-3.5 w-3.5 rtl-flip" />
        بازگشت به پشتیبانی
      </Link>

      {/* Header card */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                <Hash className="h-2.5 w-2.5" />
                <span className="tnum tabular-nums">{ticket.code}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <CatIcon className="h-3 w-3" />
                {cat.label}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                  status.chip
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
            </div>
            <h1 className="mt-2 text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
              {ticket.subject}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span
                className="inline-flex items-center gap-1"
                title={formatDateTime(ticket.createdAt)}
              >
                <Clock className="h-2.5 w-2.5" />
                ایجاد شده {formatRelativeTime(ticket.createdAt)}
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span
                className="inline-flex items-center gap-1"
                title={formatDateTime(ticket.updatedAt)}
              >
                آخرین به‌روزرسانی {formatRelativeTime(ticket.updatedAt)}
              </span>
            </div>
          </div>

          {/* Linked order */}
          {ticket.orderId && (
            <Link
              href={`/orders/${ticket.orderId}`}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <PackageSearch className="h-3.5 w-3.5 text-primary" />
              سفارش مرتبط
              <ChevronLeft className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Closed banner */}
      {isClosed && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>
            این تیکت بسته شده است. برای ادامه گفتگو یک تیکت جدید ایجاد کنید.
          </span>
        </div>
      )}

      {/* Thread */}
      <div
        ref={threadRef}
        className="max-h-[60vh] min-h-[200px] space-y-4 overflow-y-auto rounded-2xl border border-border bg-card/30 p-4 sm:p-6"
      >
        {replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
            <MessageCircle className="mb-2 h-8 w-8 opacity-50" />
            هنوز پیامی در این گفتگو نیست.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {replies.map((r) => (
              <Bubble
                key={r.id}
                reply={r}
                currentUserId={currentUserId}
                optimistic={r.id === optimisticId}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Reply composer */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <div className="mb-2 flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            پاسخ شما
          </span>
        </div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isClosed
              ? "این تیکت بسته شده است…"
              : "پاسخ خود را بنویسید…"
          }
          disabled={isClosed}
          className="min-h-20 resize-y leading-7"
          maxLength={4000}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !submitting && !isClosed) {
              handleReply();
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            <span className="tnum tabular-nums">{toFaDigits(message.length)}</span>{" "}
            / ۴۰۰۰
          </span>
          <Button
            type="button"
            onClick={handleReply}
            disabled={isClosed || submitting || !message.trim()}
            className="h-10 gap-2 px-5 shadow-soft"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال ارسال…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                ارسال پاسخ
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  reply,
  currentUserId,
  optimistic,
}: {
  reply: TicketReply;
  currentUserId: string;
  optimistic: boolean;
}) {
  const isStaff = reply.isStaff;
  const isOwn = !isStaff && reply.userId === currentUserId;
  const alignRight = isOwn; // user's own messages on the right (RTL reading)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: optimistic ? 0.7 : 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex", alignRight ? "justify-start" : "justify-end")}
    >
      <div className={cn("flex max-w-[85%] gap-2.5", alignRight && "flex-row-reverse")}>
        {/* Avatar */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            isStaff
              ? "bg-primary/10 text-primary"
              : "bg-accent text-accent-foreground"
          )}
        >
          {isStaff ? <Headphones className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "flex flex-col gap-1 rounded-2xl border px-4 py-2.5",
            isStaff
              ? "border-primary/20 bg-primary/5 rounded-tr-sm"
              : "border-border bg-card rounded-tl-sm"
          )}
        >
          <div className="flex items-center gap-1.5">
            {isStaff && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <Headphones className="h-2.5 w-2.5" />
                پشتیبانی
              </span>
            )}
            {!isStaff && isOwn && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                شما
              </span>
            )}
            <span
              className="text-[10px] text-muted-foreground"
              title={formatDateTime(reply.createdAt)}
            >
              {formatRelativeTime(reply.createdAt)}
            </span>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
            {reply.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
