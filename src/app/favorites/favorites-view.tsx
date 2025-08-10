"use client";

import Link from "next/link";
import { ServiceCard } from "@/components/brand/service-card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { Heart, ArrowLeft, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FavService {
  id: string;
  slug: string;
  name: string;
  platform: string;
  category: string;
  summary: string;
  emoji: string;
  tiers: Array<{
    id: string;
    tier: string;
    displayName: string;
    tagline: string;
    pricePer1000: number;
    deliveryEstimate: string;
  }>;
}

export function FavoritesView({ allServices }: { allServices: FavService[] }) {
  const { favorites, clear, hydrated } = useFavorites();

  if (!hydrated) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shimmer h-64 rounded-2xl border border-border/60 bg-card/40"
          />
        ))}
      </div>
    );
  }

  const favServices = allServices.filter((s) => favorites.includes(s.slug));

  if (favServices.length === 0) {
    return (
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/5 text-3xl">
            <Heart className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            لیست علاقه‌مندی‌های شما خالی است
          </h3>
          <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
            با کلیک بر روی قلب کنار هر سرویس، آن را برای دسترسی سریع‌تر اینجا
            ذخیره کنید.
          </p>
          <Button asChild className="mt-6 gap-1.5">
            <Link href="/services/instagram">
              مرور سرویس‌ها
              <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="tnum font-semibold tabular-nums text-foreground">
            {favServices.length.toLocaleString("fa-IR")}
          </span>{" "}
          سرویس ذخیره‌شده
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("از پاک کردن همه علاقه‌مندی‌ها مطمئن هستید؟")) {
              clear();
            }
          }}
          className="gap-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
          پاک کردن همه
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false}>
          {favServices.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <ServiceCard service={s} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
