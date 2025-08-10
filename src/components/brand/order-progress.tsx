"use client";

import { formatQuantity, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Order progress bar — shows completedCount / quantity.
 *
 * Custom-built (rather than shadcn Progress) so we can:
 *   1. Fill from the RIGHT (RTL reading start) by anchoring the bar to the
 *      right edge with `right-0` + `origin-right` + scaleX transform.
 *   2. Color the indicator by status tone (success / amber / red / primary).
 *   3. Animate width with a CSS transition that respects reduced-motion.
 */
export function OrderProgress({
  completedCount,
  quantity,
  status,
  className,
}: {
  completedCount: number;
  quantity: number;
  status: string;
  className?: string;
}) {
  const pct =
    quantity > 0 ? Math.min(100, Math.round((completedCount / quantity) * 100)) : 0;

  const indicatorClass =
    status === "COMPLETED"
      ? "bg-emerald-500"
      : status === "PARTIAL"
        ? "bg-amber-500"
        : status === "FAILED"
          ? "bg-red-500"
          : "bg-primary";

  const remaining = Math.max(0, quantity - completedCount);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">پیشرفت سفارش</span>
        <span className="tnum font-semibold tabular-nums text-foreground">
          {toFaDigits(pct)}٪
        </span>
      </div>

      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "absolute right-0 top-0 h-full rounded-full transition-[width,background-color] duration-700 ease-out",
            indicatorClass
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="tnum">
          انجام شده:{" "}
          <span className="font-medium text-foreground">
            {formatQuantity(completedCount)}
          </span>
        </span>
        <span className="tnum">
          باقی‌مانده:{" "}
          <span className="font-medium text-foreground">
            {formatQuantity(remaining)}
          </span>
        </span>
      </div>
    </div>
  );
}
