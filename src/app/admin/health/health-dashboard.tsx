"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Database,
  Server,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ShoppingBag,
  Package,
  Wallet,
  TrendingUp,
  AlertCircle,
  HardDrive,
} from "lucide-react";
import { formatToman, formatRelativeTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

interface HealthData {
  db: {
    totalUsers: number;
    totalOrders: number;
    totalServices: number;
    totalWalletTransactions: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
    failedOrders: number;
    dbFileSizeBytes: number | null;
  };
  recentEvents: Array<{
    id: string;
    status: string;
    message: string;
    createdAt: string;
    orderCode: string;
  }>;
  worker:
    | { ok: true; lastTick: string }
    | { ok: false; error: string };
}

export function HealthDashboard({ data }: { data: HealthData }) {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          سلامت سیستم
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          وضعیت سرور، دیتابیس و worker را یک‌جا ببینید.
        </p>
      </div>

      {/* System status cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Worker status */}
        <Card
          className={cn(
            "p-5 transition-colors",
            data.worker.ok
              ? "border-emerald-500/25 bg-emerald-500/[0.03]"
              : "border-red-500/25 bg-red-500/[0.03]"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl",
                  data.worker.ok
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                <Server className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Worker (پورت ۳۰۰۳)
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Background order processor
                </div>
              </div>
            </div>
            {data.worker.ok ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="mt-3 text-xs">
            {data.worker.ok ? (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">وضعیت:</span>
                  <Badge className="bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/12 dark:text-emerald-400">
                    سالم
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">آخرین فعالیت:</span>
                  <span className="tnum font-medium tabular-nums text-foreground">
                    {formatRelativeTime(data.worker.lastTick)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>خطا: {data.worker.error}</span>
              </div>
            )}
          </div>
        </Card>

        {/* DB status */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-foreground">
                دیتابیس (SQLite)
              </div>
              <div className="text-[11px] text-muted-foreground">
                {data.db.dbFileSizeBytes
                  ? formatBytes(data.db.dbFileSizeBytes)
                  : "—"}
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">جداول:</span>
              <span className="font-medium text-foreground">۱۳ مدل</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">مهاجرت‌ها:</span>
              <Badge className="bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/12 dark:text-emerald-400">
                همگام
              </Badge>
            </div>
          </div>
        </Card>

        {/* App server status */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-foreground">
                سرور اپ (پورت ۳۰۰۰)
              </div>
              <div className="text-[11px] text-muted-foreground">
                Next.js 16 + Turbopack
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">وضعیت:</span>
              <Badge className="bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/12 dark:text-emerald-400">
                در حال اجرا
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">محیط:</span>
              <span className="font-medium text-foreground">توسعه</span>
            </div>
          </div>
        </Card>
      </div>

      {/* DB stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <StatTile icon={Users} label="کاربران" value={data.db.totalUsers} tone="primary" />
        <StatTile icon={ShoppingBag} label="سفارش‌ها" value={data.db.totalOrders} tone="info" />
        <StatTile icon={Package} label="سرویس‌ها" value={data.db.totalServices} tone="muted" />
        <StatTile icon={Wallet} label="تراکنش‌ها" value={data.db.totalWalletTransactions} tone="success" />
        <StatTile icon={TrendingUp} label="درآمد" value={data.db.totalRevenue} tone="success" isCurrency />
        <StatTile icon={Clock} label="در انتظار" value={data.db.pendingOrders} tone="warning" />
      </div>

      {/* Order status breakdown */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground">تکمیل‌شده</span>
          </div>
          <div className="tnum mt-1 text-2xl font-bold tabular-nums text-foreground">
            {toFaDigits(data.db.completedOrders)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">در انتظار/در حال</span>
          </div>
          <div className="tnum mt-1 text-2xl font-bold tabular-nums text-foreground">
            {toFaDigits(data.db.pendingOrders)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground">ناموفق/ناقص</span>
          </div>
          <div className="tnum mt-1 text-2xl font-bold tabular-nums text-foreground">
            {toFaDigits(data.db.failedOrders)}
          </div>
        </Card>
      </div>

      {/* Recent events */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-foreground">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              آخرین رویدادهای سفارش
            </h2>
            <p className="text-xs text-muted-foreground">
              ۱۰ رویداد اخیر از worker
            </p>
          </div>
        </div>
        {data.recentEvents.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            هنوز رویدادی ثبت نشده است.
          </p>
        ) : (
          <div className="space-y-2">
            {data.recentEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
              >
                <span
                  className={cn(
                    "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                    e.status === "COMPLETED" && "bg-emerald-500",
                    e.status === "IN_PROGRESS" && "bg-amber-500",
                    e.status === "FAILED" && "bg-red-500",
                    !["COMPLETED", "IN_PROGRESS", "FAILED"].includes(e.status) &&
                      "bg-primary"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="tnum text-xs font-medium tabular-nums text-foreground">
                      {e.orderCode}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {e.status}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                    {e.message}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatRelativeTime(e.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
  isCurrency,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "primary" | "info" | "muted" | "success" | "warning";
  isCurrency?: boolean;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    muted: "bg-muted text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            tones[tone]
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="tnum mt-2 text-lg font-bold tabular-nums text-foreground">
        {isCurrency ? `${formatToman(value)}` : toFaDigits(value)}
      </div>
      {isCurrency && (
        <span className="text-[10px] text-muted-foreground">تومان</span>
      )}
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${toFaDigits(bytes)} B`;
  if (bytes < 1024 * 1024) return `${toFaDigits((bytes / 1024).toFixed(1))} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${toFaDigits((bytes / (1024 * 1024)).toFixed(1))} MB`;
  return `${toFaDigits((bytes / (1024 * 1024 * 1024)).toFixed(1))} GB`;
}
