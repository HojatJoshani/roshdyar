import { db } from "@/lib/db";
import { FeaturedReviews } from "@/components/brand/featured-reviews";
import { Star } from "lucide-react";

/**
 * Server-side wrapper for the home page's featured reviews section.
 * Fetches whether ANY reviews exist — if none, renders nothing (so the
 * home page doesn't show an empty "reviews" section before users have
 * reviewed anything). The actual review cards are loaded client-side via
 * the FeaturedReviews component (React Query) for automatic refresh.
 */
export async function FeaturedReviewsSection() {
  const count = await db.serviceReview.count({
    where: { isHidden: false, rating: { gte: 4 } },
  });

  if (count === 0) return null;

  return (
    <section className="border-y border-border/60 bg-card/30">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              نظرات واقعی کاربران
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              چه می‌گویند؟
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              این نظرات فقط توسط کاربرانی که سفارش تکمیل‌شده دارند ثبت شده — نه
              نظرات تبلیغاتی یا ساختگی.
            </p>
          </div>
        </div>
        <FeaturedReviews />
      </div>
    </section>
  );
}
