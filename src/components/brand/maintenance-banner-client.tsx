"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, X } from "lucide-react";

/**
 * Client component for the maintenance banner. Dismissible per-session
 * (stored in sessionStorage so it reappears on next visit).
 * Uses useSession() to determine if the current user is an admin
 * (admins see a different message).
 */
export function MaintenanceBannerClient({
  message,
}: {
  message: string;
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("roshdgar:maintenance-dismissed") === "true";
  });

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("roshdgar:maintenance-dismissed", "true");
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden border-b border-amber-500/40 bg-gradient-to-l from-amber-500/12 via-amber-500/8 to-amber-500/12"
      >
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
              <Wrench className="h-4 w-4" />
            </span>
            <div className="text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-300">
                {isAdmin ? "حالت تعمیرات فعال است" : "حالت تعمیرات"}
              </span>
              <span className="mx-1.5 text-amber-700/60 dark:text-amber-400/60">
                •
              </span>
              <span className="text-amber-800 dark:text-amber-300">
                {isAdmin
                  ? `ثبت سفارش برای کاربران غیرفعال است. ${message}`
                  : message}
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-amber-700 transition-colors hover:bg-amber-500/20 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-500/15"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
