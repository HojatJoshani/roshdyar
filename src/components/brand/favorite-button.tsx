"use client";

import { Heart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function FavoriteButton({
  slug,
  name,
  size = "md",
  className,
}: {
  slug: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { isFavorite, toggle, hydrated } = useFavorites();
  const fav = isFavorite(slug);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(slug);
    if (name) {
      toast.success(
        fav ? `"${name}" از علاقه‌مندی‌ها حذف شد."` : `"${name}" به علاقه‌مندی‌ها اضافه شد."`,
        { duration: 1600 }
      );
    }
  };

  const sizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };
  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={fav ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      aria-pressed={fav}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border transition-all duration-200",
        sizes[size],
        fav
          ? "border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/15"
          : "border-border/60 bg-card/60 text-muted-foreground hover:border-red-500/40 hover:text-red-500",
        !hydrated && "opacity-60",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {fav ? (
          <motion.span
            key="filled"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <Heart className={cn(iconSizes[size], "fill-current")} />
          </motion.span>
        ) : (
          <motion.span
            key="outline"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <Heart className={iconSizes[size]} />
          </motion.span>
        )}
      </AnimatePresence>
      {/* Pulse ring on toggle */}
      {fav && hydrated && (
        <motion.span
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 rounded-full bg-red-500/30"
        />
      )}
    </button>
  );
}
