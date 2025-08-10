import { SiteShell } from "@/components/brand/site-shell";
import { Skeleton, HeroSkeleton } from "@/components/brand/skeleton";

export default function WalletLoading() {
  return (
    <SiteShell>
      <HeroSkeleton title="کیف پول" />
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Balance hero skeleton */}
        <Skeleton className="mb-6 h-40 w-full rounded-3xl" />
        <div className="mb-4 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
