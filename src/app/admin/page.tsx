import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/brand/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Package,
  ArrowLeft,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Settings,
  ExternalLink,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  formatToman,
  formatQuantity,
  formatRelativeTime,
  toFaDigits,
} from "@/lib/format";
import { OrderStatus } from "@/lib/constants";
import { TxType } from "@/lib/wallet";
import { AdminCharts } from "./admin-charts";

export const dynamic = "force-dynamic";

const txIcon = (type: TxType) => {
  switch (type) {
    case "DEPOSIT":
      return { Icon: ArrowDownLeft, cls: "bg-emerald-500/12 text-emerald-600" };
    case "ORDER_PAYMENT":
      return { Icon: ArrowUpRight, cls: "bg-primary/12 text-primary" };
    case "REFUND":
      return { Icon: RotateCcw, cls: "bg-amber-500/12 text-amber-600" };
    default:
      return { Icon: Settings, cls: "bg-muted text-muted-foreground" };
  }
};

export default async function AdminDashboardPage() {
  // KPIs via aggregations
  const [
    revenueAgg,
    totalOrders,
    pendingOrders,
    activeServices,
    recentOrders,
    recentTxs,
    chartData,
  ] = await Promise.all([
    db.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "ORDER_PAYMENT", direction: "DEBIT" },
    }),
    db.order.count(),
    db.order.count({
      where: {
        status: { in: ["PENDING", "PAYMENT_CONFIRMED", "PROCESSING", "IN_PROGRESS"] },
      },
    }),
    db.service.count({ where: { isActive: true } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { email: true, name: true } },
      },
    }),
    db.walletTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { email: true, name: true } },
      },
    }),
    // Build last-14-days chart data: revenue + orders per day
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 13);
      since.setHours(0, 0, 0, 0);

      const [orders, payments] = await Promise.all([
        db.order.findMany({
          where: { createdAt: { gte: since } },
          select: { createdAt: true, totalAmount: true, status: true },
        }),
        db.walletTransaction.findMany({
          where: {
            createdAt: { gte: since },
            type: "ORDER_PAYMENT",
            direction: "DEBIT",
          },
          select: { createdAt: true, amount: true },
        }),
      ]);

      // Build a map of date (YYYY-MM-DD) → { orders, revenue, completed }
      const days: { date: string; label: string; orders: number; revenue: number; completed: number }[] = [];
      const faShortDate = (d: Date) =>
        new Intl.DateTimeFormat("fa-IR", {
          month: "short",
          day: "numeric",
        }).format(d);

      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        days.push({
          date: key,
          label: faShortDate(d),
          orders: 0,
          revenue: 0,
          completed: 0,
        });
      }
      const dayMap = new Map(days.map((d) => [d.date, d]));

      for (const o of orders) {
        const key = o.createdAt.toISOString().slice(0, 10);
        const day = dayMap.get(key);
        if (day) {
          day.orders++;
          if (o.status === "COMPLETED") day.completed++;
        }
      }
      for (const p of payments) {
        const key = p.createdAt.toISOString().slice(0, 10);
        const day = dayMap.get(key);
        if (day) day.revenue += p.amount;
      }

      return days;
    })(),
  ]);

  const totalRevenue = revenueAgg._sum.amount ?? 0;

  const kpis = [
    {
      label: "درآمد کل",
      value: `${formatToman(totalRevenue)} ت`,
      sub: "از پرداخت سفارش‌ها",
      Icon: TrendingUp,
      tone: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "تعداد سفارش‌ها",
      value: toFaDigits(totalOrders),
      sub: "از ابتدا تا کنون",
      Icon: ShoppingBag,
      tone: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "سفارش‌های در حال انجام",
      value: toFaDigits(pendingOrders),
      sub: "در صف یا در حال اجرا",
      Icon: Clock,
      tone: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "خدمات فعال",
      value: toFaDigits(activeServices),
      sub: "سرویس‌های در دسترس",
      Icon: Package,
      tone: "text-foreground",
      bg: "bg-muted",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">داشبورد</h1>
        <p className="text-sm text-muted-foreground">
          نگاهی کلی به وضعیت پلتفرم رشدیار.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="gap-0 py-4">
            <CardContent className="px-4 sm:px-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                    {k.label}
                  </div>
                  <div className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl tnum">
                    {k.value}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">
                    {k.sub}
                  </div>
                </div>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${k.bg} ${k.tone}`}
                >
                  <k.Icon className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts data={chartData} />

      {/* Recent orders + Recent transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent orders — wider */}
        <Card className="lg:col-span-2 py-0">
          <CardHeader className="flex-row items-center justify-between border-b border-border/60 py-4">
            <div>
              <CardTitle className="text-base">آخرین سفارش‌ها</CardTitle>
              <CardDescription className="text-xs">۱۰ سفارش اخیر</CardDescription>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              همه سفارش‌ها
              <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                هنوز سفارشی ثبت نشده است.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pr-4">کد</TableHead>
                    <TableHead>خدمت</TableHead>
                    <TableHead>کاربر</TableHead>
                    <TableHead className="text-center">تعداد</TableHead>
                    <TableHead className="text-left">مبلغ</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>زمان</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="pr-4 font-mono text-xs">
                        <Link
                          href={`/orders/${o.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {o.code}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{o.emoji}</span>
                          <span className="truncate text-xs">{o.serviceName}</span>
                        </span>
                      </TableCell>
                      <TableCell className="max-w-40">
                        <div className="truncate text-xs text-muted-foreground">
                          {o.user?.name || o.user?.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs tnum tabular-nums">
                        {formatQuantity(o.quantity)}
                      </TableCell>
                      <TableCell className="text-left text-xs tnum font-semibold tabular-nums">
                        {formatToman(o.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={o.status as OrderStatus} size="sm" />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatRelativeTime(o.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions — narrower */}
        <Card className="py-0">
          <CardHeader className="flex-row items-center justify-between border-b border-border/60 py-4">
            <div>
              <CardTitle className="text-base">آخرین تراکنش‌ها</CardTitle>
              <CardDescription className="text-xs">۵ تراکنش اخیر</CardDescription>
            </div>
            <Link
              href="/admin/transactions"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              همه
              <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentTxs.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                هنوز تراکنشی ثبت نشده است.
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentTxs.map((t) => {
                  const { Icon, cls } = txIcon(t.type as TxType);
                  const isCredit = t.direction === "CREDIT";
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">
                          {t.description}
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground">
                          {t.user?.name || t.user?.email || "—"} •{" "}
                          {formatRelativeTime(t.createdAt)}
                        </div>
                      </div>
                      <div className="text-left">
                        <div
                          className={`text-xs font-bold tnum tabular-nums ${
                            isCredit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isCredit ? "+" : "−"}
                          {formatToman(t.amount)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          موجودی: {formatToman(t.balanceAfter)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="py-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">دسترسی سریع</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/admin/services"
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <Package className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">مدیریت خدمات</div>
              <div className="text-[11px] text-muted-foreground">قیمت‌گذاری و فعال‌سازی</div>
            </div>
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <ShoppingBag className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">سفارش‌ها</div>
              <div className="text-[11px] text-muted-foreground">پیگیری و مدیریت</div>
            </div>
          </Link>
          <Link
            href="/admin/transactions"
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <Wallet className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">تراکنش‌ها</div>
              <div className="text-[11px] text-muted-foreground">دفتر مالی</div>
            </div>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <ExternalLink className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">مشاهده سایت</div>
              <div className="text-[11px] text-muted-foreground">از دید کاربر</div>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
