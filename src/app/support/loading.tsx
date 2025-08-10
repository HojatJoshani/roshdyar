import { SiteShell } from "@/components/brand/site-shell";
import { Skeleton, HeroSkeleton } from "@/components/brand/skeleton";

export default function SupportLoading() {
  return (
    <SiteShell>
      <HeroSkeleton title="پشتیبانی" />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
