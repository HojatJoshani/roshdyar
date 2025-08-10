import { SiteShell } from "@/components/brand/site-shell";
import { Skeleton, HeroSkeleton } from "@/components/brand/skeleton";

export default function ServiceDetailLoading() {
  return (
    <SiteShell>
      <HeroSkeleton />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left: tabs + content */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-72 rounded-lg" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          {/* Right: order config card */}
          <div>
            <Skeleton className="h-[480px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
