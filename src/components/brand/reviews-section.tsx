"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating, StarInput } from "@/components/brand/star-rating";
import { formatRelativeTime, toFaDigits } from "@/lib/format";
import {
  MessageSquare,
  Star,
  Loader2,
  CheckCircle2,
  PenLine,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userDisplayName: string;
}

interface ReviewStats {
  count: number;
  average: number;
  distribution: Record<number, number>;
}

interface EligibleOrder {
  id: string;
  code: string;
  serviceName: string;
  emoji: string;
  tier: string;
  quantity: number;
  createdAt: string;
}

export function ReviewsSection({ serviceSlug }: { serviceSlug: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([]);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/services/${serviceSlug}/reviews`,
        { cache: "no-store" }
      );
      if (r.ok) {
        const d = await r.json();
        setReviews(d.reviews);
        setStats(d.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [serviceSlug]);

  const openReviewDialog = async () => {
    if (!session) {
      toast.info("برای ثبت نظر باید وارد شوید.");
      return;
    }
    try {
      const r = await fetch(
        `/api/reviews/eligible?serviceSlug=${serviceSlug}`,
        { cache: "no-store" }
      );
      if (r.ok) {
        const d = await r.json();
        setEligibleOrders(d.eligibleOrders);
        setAlreadyReviewed(d.alreadyReviewed);
      }
    } catch {
      // ignore
    }
    setDialogOpen(true);
  };

  return (
    <div>
      {/* Header + CTA */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              نظرات کاربران
            </h3>
            <p className="text-xs text-muted-foreground">
              فقط کاربرانی که سفارش تکمیل‌شده دارند.
            </p>
          </div>
        </div>
        {session && (
          <Button
            variant="outline"
            size="sm"
            onClick={openReviewDialog}
            className="gap-1.5"
          >
            <PenLine className="h-3.5 w-3.5" />
            ثبت نظر
          </Button>
        )}
      </div>

      {/* Stats summary */}
      {stats && stats.count > 0 && (
        <Card className="mb-5 p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Average */}
            <div className="flex items-center gap-4 sm:border-l sm:border-border/60 sm:pl-6">
              <div className="text-center">
                <div className="tnum text-4xl font-bold tabular-nums text-foreground">
                  {toFaDigits(stats.average.toFixed(1))}
                </div>
                <StarRating
                  rating={stats.average}
                  size={14}
                  className="mt-1 justify-center"
                />
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {toFaDigits(stats.count)} نظر
                </div>
              </div>
            </div>
            {/* Distribution */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const c = stats.distribution[star] ?? 0;
                const pct = stats.count > 0 ? (c / stats.count) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="tnum w-3 text-[11px] tabular-nums text-muted-foreground">
                      {toFaDigits(star)}
                    </span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="tnum w-6 text-end text-[11px] tabular-nums text-muted-foreground">
                      {toFaDigits(c)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shimmer h-24 rounded-2xl border border-border/60 bg-card/40"
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <h4 className="mt-3 text-sm font-semibold text-foreground">
            هنوز نظری ثبت نشده
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            اولین نفری باشید که پس از تکمیل سفارش نظر می‌دهد.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
              >
                <ReviewCard review={r} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Review dialog */}
      <ReviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        serviceSlug={serviceSlug}
        eligibleOrders={eligibleOrders}
        alreadyReviewed={alreadyReviewed}
        onSubmitted={() => {
          setDialogOpen(false);
          load();
        }}
      />
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-foreground">
            {review.userDisplayName.charAt(0) ?? "؟"}
          </span>
          <div>
            <div className="text-sm font-medium text-foreground">
              {review.userDisplayName}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {formatRelativeTime(review.createdAt)}
            </div>
          </div>
        </div>
        <StarRating rating={review.rating} size={13} />
      </div>
      {review.comment && (
        <p className="mt-3 text-sm leading-7 text-foreground/90">
          {review.comment}
        </p>
      )}
    </Card>
  );
}

function ReviewDialog({
  open,
  onOpenChange,
  serviceSlug,
  eligibleOrders,
  alreadyReviewed,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  serviceSlug: string;
  eligibleOrders: EligibleOrder[];
  alreadyReviewed: boolean;
  onSubmitted: () => void;
}) {
  const [orderId, setOrderId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setOrderId(eligibleOrders[0]?.id ?? "");
      setRating(5);
      setComment("");
    }
  }, [open, eligibleOrders]);

  const submit = async () => {
    if (!orderId) {
      toast.error("یک سفارش را انتخاب کنید.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`/api/services/${serviceSlug}/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, rating, comment }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(d?.message ?? "ثبت نظر ناموفق بود.");
        return;
      }
      toast.success("نظر شما با موفقیت ثبت شد.");
      onSubmitted();
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ثبت نظر</DialogTitle>
          <DialogDescription>
            تجربه خود را با دیگران به اشتراک بگذارید.
          </DialogDescription>
        </DialogHeader>

        {alreadyReviewed ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h4 className="mt-3 text-sm font-semibold text-foreground">
              شما قبلاً نظر ثبت کرده‌اید
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              برای هر سرویس فقط یک نظر قابل ثبت است.
            </p>
          </div>
        ) : eligibleOrders.length === 0 ? (
          <div className="py-6 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h4 className="mt-3 text-sm font-semibold text-foreground">
              سفارش تکمیل‌شده‌ای ندارید
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              برای ثبت نظر، ابتدا یک سفارش برای این سرویس ثبت و تکمیل کنید.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Order picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                سفارش شما
              </label>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="انتخاب سفارش…" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.emoji} {o.code} • {toFaDigits(o.quantity.toLocaleString("fa-IR"))} عدد
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">امتیاز</label>
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <StarInput value={rating} onChange={setRating} size={26} />
                <span className="tnum text-sm font-semibold tabular-nums text-foreground">
                  {toFaDigits(rating)} از {toFaDigits(5)}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                توضیحات (اختیاری)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="تجربه خود را بنویسید…"
                rows={4}
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground">
                {toFaDigits(comment.length)} / {toFaDigits(500)} کاراکتر
              </p>
            </div>
          </div>
        )}

        {!alreadyReviewed && eligibleOrders.length > 0 && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button onClick={submit} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              ثبت نظر
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
