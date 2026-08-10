"use client";

import { useMemo, useState } from "react";
import { ServiceCard, type ServiceCardData } from "@/components/brand/service-card";
import { CATEGORY_META, type Category } from "@/lib/constants";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";

const CATEGORY_ORDER: Category[] = ["FOLLOWERS", "LIKES", "VIEWS", "SUBSCRIBERS"];

/**
 * Catalog content with client-side category filter chips + grid + empty state.
 * The page-level server component fetches services and passes them in.
 */
export function ServiceCatalog({ services }: { services: ServiceCardData[] }) {
  const availableCategories = useMemo(() => {
    const present = new Set(services.map((s) => s.category));
    return ["ALL", ...CATEGORY_ORDER.filter((c) => present.has(c))];
  }, [services]);

  const [filter, setFilter] = useState<string>("ALL");

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: services.length };
    for (const s of services) m[s.category] = (m[s.category] ?? 0) + 1;
    return m;
  }, [services]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return services;
    return services.filter((s) => s.category === filter);
  }, [filter, services]);

  return (
    <div>
      {/* Filter chips */}
      {availableCategories.length > 1 && (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {availableCategories.map((cat) => {
            const active = filter === cat;
            const label =
              cat === "ALL" ? "همه" : CATEGORY_META[cat as Category]?.label ?? cat;
            const count = counts[cat] ?? 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-soft"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums transition-colors",
                    active ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                >
                  {toFaDigits(count)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <PackageOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            سرویسی در این دسته یافت نشد
          </h3>
          <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
            در این دسته‌بندی فعلاً سرویس فعالی نداریم. به‌زودی اضافه می‌شود؛
            در meantime می‌توانید دسته‌های دیگر را بررسی کنید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}
