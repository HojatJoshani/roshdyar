"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/brand/star-rating";
import { formatRelativeTime, toFaDigits } from "@/lib/format";
import { Star, ArrowLeft, MessageSquareQuote } from "lucide-react";

interface FeaturedReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userDisplayName: string;
  service: {
    slug: string;
    name: string;
    emoji: string;
  };
}

export function FeaturedReviews() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-reviews"],
    queryFn: async () => {
      const r = await fetch("/api/reviews/featured", { cache: "no-store" });
      if (!r.ok) throw new Error("fetch failed");
      const d = await r.json();
      return d.reviews as FeaturedReview[];
    },
    staleTime: 60_000,
  });

  const reviews = data ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shimmer h-44 rounded-2xl border border-border/60 bg-card/40"
          />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    // No reviews yet — render nothing (the parent section header is hidden too)
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence initial={false}>
        {reviews.map((r, i) => (
          <motion.div
            key={r.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.06, 0.3) }}
          >
            <Card className="flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft hover:border-primary/40">
              {/* Top: service + rating */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <Link
                  href={`/services/${r.service.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent/60 px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <span>{r.service.emoji}</span>
                  {r.service.name}
                </Link>
                <StarRating rating={r.rating} size={13} />
              </div>

              {/* Comment (or fallback) */}
              {r.comment ? (
                <p className="flex-1 text-sm leading-7 text-foreground/90">
                  <MessageSquareQuote className="mb-1 ml-1 inline h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  {r.comment}
                </p>
              ) : (
                <p className="flex-1 text-sm italic leading-7 text-muted-foreground">
                  بدون توضیح اضافه — امتیاز{" "}
                  {toFaDigits(r.rating)} از{" "}
                  {toFaDigits(5)} ستاره.
                </p>
              )}

              {/* Footer: user + time */}
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {r.userDisplayName.charAt(0) ?? "؟"}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {r.userDisplayName}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(r.createdAt)}
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
