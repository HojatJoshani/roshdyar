import { Skeleton } from "@/components/brand/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Sidebar skeleton */}
      <aside className="hidden w-60 shrink-0 border-l border-border/60 bg-card md:block">
        <div className="p-4">
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <div className="space-y-1 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 p-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
      </main>
    </div>
  );
}
