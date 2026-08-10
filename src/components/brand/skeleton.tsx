import { cn } from "@/lib/utils";

/**
 * Reusable skeleton primitives for loading states. Uses the design system's
 * `shimmer` utility (defined in globals.css) for the animated shimmer effect.
 */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "shimmer rounded-md bg-muted/60",
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4",
        className
      )}
    >
      <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="space-y-2 text-end">
        <Skeleton className="ml-auto h-4 w-20" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
    </div>
  );
}

export function SkeletonList({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Page-level loading shell — used in `loading.tsx` files. */
export function PageSkeleton({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("container mx-auto px-4 py-8 md:py-12", className)}>
      {children ?? <SkeletonList count={4} />}
    </div>
  );
}

/** A hero-strip skeleton for pages with a mesh-brand header. */
export function HeroSkeleton({ title = "در حال بارگذاری…" }: { title?: string }) {
  return (
    <section className="border-b border-border/60 bg-mesh-brand">
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full rounded" />
      </div>
    </section>
  );
}
