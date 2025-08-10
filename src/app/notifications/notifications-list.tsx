"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/brand/status-badge";
import { useNotifications } from "@/hooks/use-notifications";
import { formatRelativeTime, formatDateTime, toFaDigits } from "@/lib/format";
import { CheckCheck, Bell, ArrowLeft } from "lucide-react";
import { STATUS_META, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function NotificationsList({
  initialNotifications,
  initialUnread,
}: {
  initialNotifications: Array<{
    id: string;
    orderId: string;
    orderCode: string;
    orderEmoji: string;
    serviceName: string;
    status: string;
    message: string;
    createdAt: string;
    read: boolean;
  }>;
  initialUnread: number;
}) {
  const { notifications, unread, markAllRead, isMarking } = useNotifications();
  // Use live data from the hook if available, else initial server data
  const list = notifications.length > 0 ? notifications : initialNotifications;
  const unreadCount = useNotifications().unread ?? initialUnread;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Top bar with summary + mark-all-read */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">جمع اعلان‌ها:</span>
          <span className="tnum font-semibold tabular-nums text-foreground">
            {toFaDigits(list.length)}
          </span>
          {unreadCount > 0 && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {toFaDigits(unreadCount)} خوانده‌نشده
              </span>
            </>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={isMarking}
            className="gap-1.5"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            خواندن همه
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {list.map((n, i) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
              >
                <NotificationRow n={n} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  n,
}: {
  n: {
    id: string;
    orderId: string;
    orderCode: string;
    orderEmoji: string;
    serviceName: string;
    status: string;
    message: string;
    createdAt: string;
    read: boolean;
  };
}) {
  const meta = STATUS_META[n.status as OrderStatus];
  return (
    <Link href={`/orders/${n.orderId}`} className="group block">
      <Card
        className={cn(
          "relative flex items-start gap-3 overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft hover:border-primary/40 sm:p-5",
          !n.read && "border-primary/30 bg-primary/[0.03]"
        )}
      >
        {/* Unread indicator strip */}
        {!n.read && (
          <span className="absolute inset-y-0 right-0 w-1 bg-primary" />
        )}
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-xl">
          {n.orderEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
            <div className="flex items-center gap-2">
              <span className="tnum text-sm font-semibold tabular-nums text-foreground">
                {n.serviceName}
              </span>
              <span className="text-[11px] text-muted-foreground/60">•</span>
              <span className="tnum text-[11px] font-medium tabular-nums text-muted-foreground">
                {n.orderCode}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {formatRelativeTime(n.createdAt)}
            </span>
          </div>
          <p
            className={cn(
              "mt-1.5 text-sm leading-6",
              n.read ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {n.message}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={n.status as OrderStatus} size="sm" />
            <span className="text-[10px] text-muted-foreground/70">
              {formatDateTime(n.createdAt)}
            </span>
          </div>
        </div>
        <ArrowLeft className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary rtl-flip" />
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 px-6 py-20 text-center">
      <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl">
        <Bell className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        هنوز اعلانی دریافت نکرده‌اید
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        به‌محض تغییر وضعیت سفارش‌هایتان، اعلان‌ها اینجا نمایش داده می‌شوند.
      </p>
      <Button asChild className="mt-6 gap-1.5">
        <Link href="/orders">
          مشاهده سفارش‌ها
          <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
        </Link>
      </Button>
    </div>
  );
}
