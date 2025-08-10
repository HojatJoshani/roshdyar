import { SiteShell } from "@/components/brand/site-shell";
import { Skeleton, HeroSkeleton, SkeletonGrid } from "@/components/brand/skeleton";

export default function FavoritesLoading() {
  return (
    <SiteShell>
      <HeroSkeleton title="علاقه‌مندی‌های من" />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Skeleton className="mb-6 h-5 w-32 rounded" />
        <SkeletonGrid count={3} />
      </div>
    </SiteShell>
  );
}
