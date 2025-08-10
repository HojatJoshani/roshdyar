"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserCog, ArrowLeftRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Banner shown at the top of the page when an admin is impersonating a user.
 * Shows the target user's identity + a "بازگشت به حساب مدیریت" button that
 * calls /api/auth/end-impersonation to restore the admin's session.
 */
export function ImpersonationBanner() {
  const { data: session } = useSession();
  const [ending, setEnding] = useState(false);

  const imp = (session?.user as any)?.impersonating;
  if (!imp) return null;

  const handleEnd = async () => {
    setEnding(true);
    try {
      const r = await fetch("/api/auth/end-impersonation", {
        method: "POST",
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(d?.message ?? "خروج از جعل هویت ناموفق بود.");
        return;
      }
      toast.success("بازگشت به حساب مدیریت...");
      setTimeout(() => {
        window.location.href = "/admin/users";
      }, 800);
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setEnding(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden border-b border-amber-500/40 bg-amber-500/[0.08]"
      >
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
              <UserCog className="h-4 w-4" />
            </span>
            <div className="text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-300">
                حالت جعل هویت
              </span>
              <span className="mx-1.5 text-amber-700/60 dark:text-amber-400/60">•</span>
              <span className="text-amber-800 dark:text-amber-300">
                شما به‌عنوان{" "}
                <span className="font-semibold">
                  {imp.targetUserName ?? imp.targetUserEmail}
                </span>{" "}
                ({imp.targetUserEmail}) وارد شده‌اید
              </span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleEnd}
            disabled={ending}
            className="h-7 gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
          >
            {ending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowLeftRight className="h-3.5 w-3.5" />
            )}
            بازگشت به حساب مدیریت
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
