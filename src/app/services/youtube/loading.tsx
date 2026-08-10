import { SiteShell } from "@/components/brand/site-shell";
import { Skeleton, SkeletonGrid, HeroSkeleton } from "@/components/brand/skeleton";

export default function ServicesLoading() {
  return (
    <SiteShell>
      <HeroSkeleton />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <SkeletonGrid count={6} />
      </div>
    </SiteShell>
  );
}
