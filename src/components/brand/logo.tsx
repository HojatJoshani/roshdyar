import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 28,
  withWordmark = true,
  wordmarkClassName,
}: {
  className?: string;
  size?: number;
  withWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className="relative inline-flex items-center justify-center rounded-xl shadow-sm"
        style={{
          width: size,
          height: size,
          background:
            "linear-gradient(135deg, oklch(0.62 0.15 162) 0%, oklch(0.55 0.13 180) 50%, oklch(0.5 0.1 200) 100%)",
        }}
      >
        {/* Growth chart icon — ascending bars + arrow */}
        <svg
          width={size * 0.62}
          height={size * 0.62}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ascending bars */}
          <rect x="4" y="14" width="3" height="6" rx="1" fill="white" fillOpacity="0.5" />
          <rect x="9" y="11" width="3" height="9" rx="1" fill="white" fillOpacity="0.7" />
          <rect x="14" y="8" width="3" height="12" rx="1" fill="white" />
          {/* Arrow pointing up-right */}
          <path
            d="M18 6L14 10M18 6L15 5M18 6L19 9"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Subtle shine */}
        <span
          className="absolute inset-0 rounded-xl opacity-30"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
          }}
        />
      </span>
      {withWordmark && (
        <span
          className={cn(
            "font-extrabold tracking-tight text-foreground",
            wordmarkClassName
          )}
          style={{ fontSize: size * 0.62 }}
        >
          رشدیار
        </span>
      )}
    </div>
  );
}
