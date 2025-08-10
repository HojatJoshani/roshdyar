"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toFaDigits } from "@/lib/format";
import { useState } from "react";

export function StarRating({
  rating,
  size = 16,
  className,
  showValue = false,
  count,
}: {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  count?: number;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.round(rating);
          return (
            <Star
              key={i}
              style={{ width: size, height: size }}
              className={cn(
                "transition-colors",
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/40"
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="tnum text-xs font-semibold tabular-nums text-foreground">
          {toFaDigits(rating.toFixed(1))}
        </span>
      )}
      {count !== undefined && (
        <span className="text-[11px] text-muted-foreground">
          ({toFaDigits(count)})
        </span>
      )}
    </div>
  );
}

export function StarInput({
  value,
  onChange,
  size = 28,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  className?: string;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={() => setHover(0)}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const filled = n <= display;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-md p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${toFaDigits(n)} ستاره`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                "transition-colors",
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/40 hover:text-amber-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
