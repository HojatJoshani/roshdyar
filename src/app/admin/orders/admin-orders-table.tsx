"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/brand/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatToman, formatQuantity, formatRelativeTime, toFaDigits } from "@/lib/format";
import { OrderStatus, STATUS_META } from "@/lib/constants";
import { Search } from "lucide-react";

export type AdminOrder = {
  id: string;
  code: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  serviceName: string;
  serviceSlug: string;
  platform: string;
  category: string;
  tier: string;
  tierDisplay: string;
  emoji: string;
  quantity: number;
  unitPricePer1000: number;
  totalAmount: number;
  targetLink: string;
  notes: string | null;
  status: OrderStatus;
  startedCount: number;
  remainsCount: number;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
};

type Filter = "ALL" | OrderStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "همه" },
  { value: "PENDING", label: "در انتظار" },
  { value: "PAYMENT_CONFIRMED", label: "پرداخت‌شده" },
  { value: "PROCESSING", label: "در حال ارسال" },
  { value: "IN_PROGRESS", label: "در حال انجام" },
  { value: "COMPLETED", label: "تکمیل‌شده" },
  { value: "PARTIAL", label: "ناقص" },
  { value: "FAILED", label: "ناموفق" },
];

export function AdminOrdersTable({ orders }: { orders: AdminOrder[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== "ALL" && o.status !== filter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          o.code.toLowerCase().includes(q) ||
          o.serviceName.toLowerCase().includes(q) ||
          o.userEmail?.toLowerCase().includes(q) ||
          o.userName?.toLowerCase().includes(q) ||
          o.targetLink.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, filter, query]);

  const countByStatus = (s: OrderStatus) =>
    orders.filter((o) => o.status === s).length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const count = f.value === "ALL" ? orders.length : countByStatus(f.value as OrderStatus);
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tnum tabular-nums",
                    active ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                >
                  {toFaDigits(count)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجو: کد، خدمت، ایمیل، لینک…"
            className="h-9 pr-9 text-xs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        نمایش {toFaDigits(filtered.length)} از {toFaDigits(orders.length)} سفارش
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pr-3">کد</TableHead>
              <TableHead>خدمت</TableHead>
              <TableHead>کاربر</TableHead>
              <TableHead className="text-center">تعداد</TableHead>
              <TableHead className="text-center">انجام‌شده</TableHead>
              <TableHead className="text-left">مبلغ</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>زمان</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  سفارشی با این فیلتر پیدا نشد.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => {
                const completedPct =
                  o.quantity > 0 ? Math.min(100, Math.round((o.completedCount / o.quantity) * 100)) : 0;
                return (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-accent/40">
                    <TableCell className="pr-3">
                      <Link
                        href={`/orders/${o.id}`}
                        className="block font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {o.code}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-44">
                      <Link
                        href={`/orders/${o.id}`}
                        className="flex items-center gap-1.5"
                      >
                        <span className="shrink-0">{o.emoji}</span>
                        <span className="truncate text-xs">{o.serviceName}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-44">
                      <div className="truncate text-xs font-medium">
                        {o.userName || "—"}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {o.userEmail || ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs tnum tabular-nums">
                      {formatQuantity(o.quantity)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-muted-foreground tnum tabular-nums">
                          {toFaDigits(completedPct)}٪
                        </span>
                        <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${completedPct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-left text-xs tnum font-semibold tabular-nums">
                      {formatToman(o.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeTime(o.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
