import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * RTL-aware breadcrumb. Uses ChevronLeft separators which correctly
 * point in the reading-flow direction for Persian (right → left).
 */
export function ServiceBreadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="مسیر صفحه"
      className={cn("flex flex-wrap items-center gap-1.5 text-sm", className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const isLink = !!item.href && !isLast;
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            {i > 0 && (
              <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            )}
            {isLink ? (
              <Link
                href={item.href!}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
