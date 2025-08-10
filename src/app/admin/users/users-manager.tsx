"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users as UsersIcon,
  Search,
  ShieldOff,
  ShieldCheck,
  Loader2,
  Mail,
  ShoppingBag,
  Wallet,
  LifeBuoy,
  Calendar,
  Ban,
  UserCheck,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatToman,
  formatRelativeTime,
  toFaDigits,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  banned: boolean;
  createdAt: string;
  walletBalance: number;
  totalOrders: number;
  totalTickets: number;
  totalSpent: number;
}

type Filter = "all" | "active" | "banned";

export function UsersManager({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = users.filter((u) => {
    if (filter === "active" && u.banned) return false;
    if (filter === "banned" && !u.banned) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const bannedCount = users.filter((u) => u.banned).length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const customerCount = users.length - adminCount;

  const toggleBan = async (id: string, current: boolean) => {
    try {
      const r = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ banned: !current }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(d?.message ?? "عملیات ناموفق بود.");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, banned: !current } : u))
      );
      toast.success(!current ? "کاربر مسدود شد." : "کاربر آزاد شد.");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          مدیریت کاربران
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          مشاهده و مدیریت کاربران پلتفرم. امکان مسدودکردن کاربران مخرب.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="کل کاربران" value={users.length} icon={UsersIcon} tone="primary" />
        <KpiCard label="مشتریان" value={customerCount} icon={UserCheck} tone="success" />
        <KpiCard label="مدیران" value={adminCount} icon={ShieldCheck} tone="info" />
        <KpiCard label="مسدودشده" value={bannedCount} icon={Ban} tone="danger" />
      </div>

      {/* Search + filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(
            [
              { key: "all", label: "همه" },
              { key: "active", label: "فعال" },
              { key: "banned", label: "مسدود" },
            ] as { key: Filter; label: string }[]
          ).map((f) => {
            const active = filter === f.key;
            const count =
              f.key === "all"
                ? users.length
                : f.key === "active"
                  ? users.length - bannedCount
                  : bannedCount;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    active ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                >
                  {toFaDigits(count)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو با نام یا ایمیل…"
            className="h-9 w-full rounded-lg border border-border bg-card pr-9 pl-3 text-sm transition-colors focus:border-primary/40 focus:outline-none sm:w-72"
          />
        </div>
      </div>

      {/* Users list */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <UsersIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-3 text-base font-semibold text-foreground">
            کاربری یافت نشد
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search.trim()
              ? "با این جستجو کاربری پیدا نشد."
              : "هنوز کاربری ثبت‌نام نکرده است."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((u, i) => (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.15) }}
              >
                <UserCard user={u} onToggleBan={() => toggleBan(u.id, u.banned)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "info" | "danger";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            tones[tone]
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="tnum text-xl font-bold tabular-nums text-foreground">
            {toFaDigits(value)}
          </div>
          <div className="text-[11px] text-muted-foreground">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function UserCard({
  user,
  onToggleBan,
}: {
  user: UserRow;
  onToggleBan: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [impLoading, setImpLoading] = useState(false);
  const router = useRouter();
  const isAdmin = user.role === "ADMIN";
  const canBan = !isAdmin;

  const handleToggle = async () => {
    setBusy(true);
    await onToggleBan();
    setBusy(false);
  };

  const handleImpersonate = async () => {
    if (!confirm(`ورود به عنوان «${user.name ?? user.email}»؟\nشما به‌عنوان این کاربر وارد می‌شوید و می‌توانید سایت را از دید او ببینید.`)) return;
    setImpLoading(true);
    try {
      const r = await fetch(`/api/admin/users/${user.id}/impersonate`, {
        method: "POST",
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(d?.message ?? "جعل هویت ناموفق بود.");
        return;
      }
      toast.success(`در حال ورود به عنوان ${d.targetUser.name ?? d.targetUser.email}...`);
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setImpLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 transition-opacity",
        user.banned && "opacity-70"
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        {/* Avatar + name + email */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
              isAdmin
                ? "bg-primary/15 text-primary"
                : user.banned
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "bg-accent text-foreground"
            )}
          >
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">
                {user.name ?? "بدون نام"}
              </span>
              {isAdmin && (
                <Badge className="bg-primary/12 text-primary hover:bg-primary/12">
                  مدیر
                </Badge>
              )}
              {user.banned && (
                <Badge className="bg-red-500/12 text-red-700 hover:bg-red-500/12 dark:text-red-400">
                  مسدود
                </Badge>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate" dir="ltr">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex shrink-0 flex-wrap items-center gap-3 text-[11px] text-muted-foreground sm:flex-col sm:items-end sm:gap-1">
          <span className="inline-flex items-center gap-1" title="کل سفارش‌ها">
            <ShoppingBag className="h-3 w-3" />
            <span className="tnum font-medium tabular-nums text-foreground">
              {toFaDigits(user.totalOrders)}
            </span>
            سفارش
          </span>
          <span className="inline-flex items-center gap-1" title="موجودی کیف پول">
            <Wallet className="h-3 w-3" />
            <span className="tnum font-medium tabular-nums text-foreground">
              {formatToman(user.walletBalance)}
            </span>
            ت
          </span>
          <span className="inline-flex items-center gap-1" title="کل spending">
            <Calendar className="h-3 w-3" />
            <span className="tnum font-medium tabular-nums text-foreground">
              {formatToman(user.totalSpent)}
            </span>
            ت
          </span>
          <span className="inline-flex items-center gap-1">
            <LifeBuoy className="h-3 w-3" />
            <span className="tnum font-medium tabular-nums text-foreground">
              {toFaDigits(user.totalTickets)}
            </span>
            تیکت
          </span>
        </div>

        {/* Action */}
        <div className="flex shrink-0 items-center gap-1.5">
          {canBan ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImpersonate}
                disabled={busy || user.banned}
                className="h-8 gap-1 text-sky-600 hover:text-sky-700 dark:text-sky-400"
                title="ورود به عنوان این کاربر"
              >
                {impLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserCog className="h-3.5 w-3.5" />
                )}
                جعل هویت
              </Button>
              <Button
                variant={user.banned ? "outline" : "ghost"}
                size="sm"
                onClick={handleToggle}
                disabled={busy}
                className={cn(
                  "h-8 gap-1",
                  !user.banned &&
                    "text-red-600 hover:text-red-700 dark:text-red-400"
                )}
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : user.banned ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <ShieldOff className="h-3.5 w-3.5" />
                )}
                {user.banned ? "آزادکردن" : "مسدودکردن"}
              </Button>
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
        </div>
      </div>
      {/* Footer: member since */}
      <div className="border-t border-border/60 bg-muted/20 px-4 py-1.5 text-[10px] text-muted-foreground sm:px-5">
        عضو از {formatRelativeTime(user.createdAt)}
      </div>
    </Card>
  );
}
