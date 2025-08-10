import { cn } from "@/lib/utils";
import { OrderStatus, STATUS_META } from "@/lib/constants";

const toneClasses: Record<string, string> = {
  neutral:
    "bg-muted text-muted-foreground border-border",
  info: "bg-primary/10 text-primary border-primary/20",
  warning:
    "bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/25",
  success:
    "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  danger:
    "bg-red-500/12 text-red-700 dark:text-red-400 border-red-500/25",
};

export function StatusBadge({
  status,
  size = "md",
  pulse = false,
  className,
}: {
  status: OrderStatus;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        toneClasses[meta.tone]
      )}
    >
      {pulse && (status === "IN_PROGRESS" || status === "PROCESSING") && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {!pulse && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {meta.label}
    </span>
  );
}
