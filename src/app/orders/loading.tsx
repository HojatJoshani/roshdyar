import { SiteShell } from "@/components/brand/site-shell";
import {
  Skeleton,
  SkeletonGrid,
  HeroSkeleton,
} from "@/components/brand/skeleton";

export default function OrdersLoading() {
  return (
    <SiteShell>
      <HeroSkeleton title="سفارش‌های من" />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
