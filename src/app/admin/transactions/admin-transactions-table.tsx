"use client";

import { useMemo, useState } from "react";
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
import {
  formatToman,
  formatRelativeTime,
  formatDateTime,
  toFaDigits,
} from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, RotateCcw, Settings, Search } from "lucide-react";
import { TxType } from "@/lib/wallet";

export type AdminTx = {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number;
  type: TxType;
  description: string;
  reference: string | null;
  orderId: string | null;
  paymentId: string | null;
  createdAt: string;
};

type Filter = "ALL" | TxType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "همه" },
  { value: "DEPOSIT", label: "شارژ" },
  { value: "ORDER_PAYMENT", label: "پرداخت سفارش" },
  { value: "REFUND", label: "بازگشت وجه" },
  { value: "ADMIN_ADJUST", label: "تنظیمات مدیریت" },
];

const txMeta: Record<TxType, { Icon: typeof ArrowDownLeft; cls: string; label: string }> = {
  DEPOSIT: {
    Icon: ArrowDownLeft,
    cls: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    label: "شارژ کیف پول",
  },
  ORDER_PAYMENT: {
    Icon: ArrowUpRight,
    cls: "bg-primary/12 text-primary",
    label: "پرداخت سفارش",
  },
  REFUND: {
    Icon: RotateCcw,
    cls: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
    label: "بازگشت وجه",
  },
  ADMIN_ADJUST: {
    Icon: Settings,
    cls: "bg-muted text-muted-foreground",
    label: "تنظیمات مدیریت",
  },
};

export function AdminTransactionsTable({ transactions }: { transactions: AdminTx[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== "ALL" && t.type !== filter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          t.userEmail?.toLowerCase().includes(q) ||
          t.userName?.toLowerCase().includes(q) ||
          t.reference?.toLowerCase().includes(q) ||
          t.orderId?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, filter, query]);

  const countByType = (type: TxType) =>
    transactions.filter((t) => t.type === type).length;

  // Totals (credit only for revenue-like summary, debit for outflow)
  const totalCredit = filtered
    .filter((t) => t.direction === "CREDIT")
    .reduce((s, t) => s + t.amount, 0);
  const totalDebit = filtered
    .filter((t) => t.direction === "DEBIT")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const count = f.value === "ALL" ? transactions.length : countByType(f.value as TxType);
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
            placeholder="جستجو: توضیحات، کاربر، شناسه سفارش…"
            className="h-9 pr-9 text-xs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Totals summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-card p-3">
          <div className="text-[11px] text-muted-foreground">تعداد تراکنش‌ها</div>
          <div className="mt-1 text-lg font-bold tnum tabular-nums text-foreground">
            {toFaDigits(filtered.length)}
          </div>
        </div>
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
          <div className="text-[11px] text-muted-foreground">مجموع واریز</div>
          <div className="mt-1 text-lg font-bold tnum tabular-nums text-emerald-600 dark:text-emerald-400">
            +{formatToman(totalCredit)}
          </div>
        </div>
        <div className="col-span-2 rounded-lg border border-red-500/25 bg-red-500/5 p-3 sm:col-span-1">
          <div className="text-[11px] text-muted-foreground">مجموع برداشت</div>
          <div className="mt-1 text-lg font-bold tnum tabular-nums text-red-600 dark:text-red-400">
            −{formatToman(totalDebit)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pr-3">نوع</TableHead>
              <TableHead>توضیحات</TableHead>
              <TableHead>کاربر</TableHead>
              <TableHead className="text-left">مبلغ</TableHead>
              <TableHead className="text-left">موجودی</TableHead>
              <TableHead>زمان</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  تراکنشی با این فیلتر پیدا نشد.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => {
                const meta = txMeta[t.type];
                const Icon = meta.Icon;
                const isCredit = t.direction === "CREDIT";
                return (
                  <TableRow key={t.id}>
                    <TableCell className="pr-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.cls}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[11px] font-medium">{meta.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-72">
                      <div className="truncate text-xs font-medium">
                        {t.description}
                      </div>
                      {t.orderId && (
                        <a
                          href={`/orders/${t.orderId}`}
                          className="text-[10px] text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          سفارش مرتبط
                        </a>
                      )}
                      {!t.orderId && t.reference && (
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {t.reference}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-44">
                      <div className="truncate text-xs font-medium">
                        {t.userName || "—"}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {t.userEmail || ""}
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-left text-xs tnum font-bold tabular-nums",
                        isCredit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {isCredit ? "+" : "−"}
                      {formatToman(t.amount)}
                    </TableCell>
                    <TableCell className="text-left text-xs tnum text-muted-foreground tabular-nums">
                      {formatToman(t.balanceAfter)}
                    </TableCell>
                    <TableCell
                      className="text-xs text-muted-foreground"
                      title={formatDateTime(t.createdAt)}
                    >
                      {formatRelativeTime(t.createdAt)}
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
