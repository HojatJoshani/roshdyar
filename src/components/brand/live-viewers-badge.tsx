"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Eye } from "lucide-react";
import { toFaDigits } from "@/lib/format";

/**
 * Honest "X نفر در حال مشاهده" badge for the service detail page.
 * Polls /api/services/[slug]/viewers every 30s. Only renders when
 * viewers > 1 (so a solo viewer doesn't see "1 نفر").
 */
export function LiveViewersBadge({ slug }: { slug: string }) {
  const { data } = useQuery({
    queryKey: ["viewers", slug],
    queryFn: async () => {
      const r = await fetch(`/api/services/${slug}/viewers`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error("fetch failed");
      const d = await r.json();
      return d.viewers as number;
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const count = data ?? 0;

  if (count <= 1) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <Eye className="h-3 w-3" />
        <span className="tnum tabular-nums">{toFaDigits(count)}</span>
        نفر در حال مشاهده
      </motion.div>
    </AnimatePresence>
  );
}
