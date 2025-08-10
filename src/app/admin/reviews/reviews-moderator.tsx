"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/brand/star-rating";
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  MessageSquare,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTime, formatRelativeTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface AdminReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  createdAt: string;
  service: { slug: string; name: string; emoji: string };
  user: { id: string; name: string | null; email: string };
}

type Filter = "all" | "visible" | "hidden";

export function ReviewsModerator({
  initialReviews,
}: {
  initialReviews: AdminReviewRow[];
}) {
  const [reviews, setReviews] = useState<AdminReviewRow[]>(initialReviews);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = reviews.filter((r) => {
    if (filter === "visible" && r.isHidden) return false;
    if (filter === "hidden" && !r.isHidden) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        r.comment?.toLowerCase().includes(q) ||
        r.service.name.toLowerCase().includes(q) ||
        r.service.slug.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q) ||
        (r.user.name ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const visibleCount = reviews.filter((r) => !r.isHidden).length;
  const hiddenCount = reviews.filter((r) => r.isHidden).length;
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const toggleHidden = async (id: string, current: boolean) => {
    try {
      const r = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isHidden: !current }),
      });
      if (!r.ok) throw new Error();
      setReviews((prev) =>
        prev.map((rv) =>
          rv.id === id ? { ...rv, isHidden: !current } : rv
        )
      );
      toast.success(!current ? "نظر مخفی شد." : "نظر نمایش داده شد.");
    } catch {
      toast.error("عملیات ناموفق بود.");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف کامل این نظر؟ این عمل قابل بازگشت نیست.")) return;
    try {
      const r = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error();
      setReviews((prev) => prev.filter((rv) => rv.id !== id));
      toast.success("نظر حذف شد.");
    } catch {
      toast.error("حذف ناموفق بود.");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          مدیریت نظرات
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          نظرات کاربران را بررسی و در صورت نیاز مخفی یا حذف کنید.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="کل نظرات" value={reviews.length} tone="primary" />
        <KpiCard
          label="نمایش داده‌شده"
          value={visibleCount}
          tone="success"
        />
        <KpiCard label="مخفی‌شده" value={hiddenCount} tone="muted" />
        <KpiCard
          label="میانگین امتیاز"
          value={avg}
          tone="info"
          isDecimal
        />
      </div>

      {/* Search + filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(
            [
              { key: "all", label: "همه" },
              { key: "visible", label: "نمایش" },
              { key: "hidden", label: "مخفی" },
            ] as { key: Filter; label: string }[]
          ).map((f) => {
            const active = filter === f.key;
            const count =
              f.key === "all"
                ? reviews.length
                : f.key === "visible"
                  ? visibleCount
                  : hiddenCount;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    active ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                >
                  {toFaDigits(count)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در نظرات، سرویس، کاربر…"
            className="h-9 w-full rounded-lg border border-border bg-card pr-9 pl-3 text-sm transition-colors focus:border-primary/40 focus:outline-none sm:w-72"
          />
        </div>
      </div>

      {/* Reviews list */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-3 text-base font-semibold text-foreground">
            نظری یافت نشد
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search.trim()
              ? "با این جستجو نظری پیدا نشد."
              : "هنوز نظری ثبت نشده است."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18 }}
              >
                <ReviewModerationCard
                  review={r}
                  onToggleHidden={() => toggleHidden(r.id, r.isHidden)}
                  onDelete={() => remove(r.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
  isDecimal,
}: {
  label: string;
  value: number;
  tone: "primary" | "success" | "muted" | "info";
  isDecimal?: boolean;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    muted: "bg-muted text-muted-foreground",
    info: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <Card className="p-4">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="tnum mt-1 text-xl font-bold tabular-nums text-foreground">
        {isDecimal ? toFaDigits(value.toFixed(1)) : toFaDigits(value)}
      </div>
      <div className={cn("mt-2 inline-flex h-1 w-10 rounded-full", tones[tone])} />
    </Card>
  );
}

function ReviewModerationCard({
  review,
  onToggleHidden,
  onDelete,
}: {
  review: AdminReviewRow;
  onToggleHidden: () => void;
  onDelete: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    setBusy(true);
    await onToggleHidden();
    setBusy(false);
  };
  const handleDelete = async () => {
    setBusy(true);
    await onDelete();
    setBusy(false);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 transition-opacity",
        review.isHidden && "opacity-60"
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
        {/* Left: rating + comment */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Star className="h-5 w-5 fill-current" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StarRating rating={review.rating} size={13} />
              <span className="tnum text-xs tabular-nums text-muted-foreground">
                {toFaDigits(review.rating)} از {toFaDigits(5)}
              </span>
              {review.isHidden ? (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  <EyeOff className="ml-1 h-3 w-3" />
                  مخفی
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/12 dark:text-emerald-400">
                  <Eye className="ml-1 h-3 w-3" />
                  نمایش
                </Badge>
              )}
            </div>
            {review.comment ? (
              <p className="mt-2 text-sm leading-7 text-foreground">
                {review.comment}
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground">
                بدون توضیح
              </p>
            )}
          </div>
        </div>

        {/* Right: meta + actions */}
        <div className="flex shrink-0 flex-col gap-2 border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0">
          <div className="text-end">
            <Link href={`/services/${review.service.slug}`} className="text-xs font-medium text-foreground hover:text-primary">
              {review.service.emoji} {review.service.name}
            </Link>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {review.user.name ?? review.user.email}
            </div>
            <div
              className="mt-0.5 text-[10px] text-muted-foreground"
              title={formatDateTime(review.createdAt)}
            >
              {formatRelativeTime(review.createdAt)}
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggle}
              disabled={busy}
              className="h-8 gap-1"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : review.isHidden ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              {review.isHidden ? "نمایش" : "مخفی"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={busy}
              className="h-8 gap-1 text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              حذف
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
