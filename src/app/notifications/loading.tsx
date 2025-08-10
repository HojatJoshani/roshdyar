import { SiteShell } from "@/components/brand/site-shell";
import { Skeleton, HeroSkeleton } from "@/components/brand/skeleton";

export default function NotificationsLoading() {
  return (
    <SiteShell>
      <HeroSkeleton title="اعلان‌ها" />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-3xl">
          <Skeleton className="mb-6 h-8 w-48 rounded-lg" />
          <div className="space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
