"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/brand/status-badge";
import {
  User as UserIcon,
  Lock,
  Wallet,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Loader2,
  Save,
  Check,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatToman,
  formatRelativeTime,
  toFaDigits,
} from "@/lib/format";
import { cn } from "@/lib/utils";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

interface StatsData {
  walletBalance: number;
  totalOrders: number;
  totalSpent: number;
}

interface RecentOrder {
  id: string;
  code: string;
  serviceName: string;
  emoji: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export function ProfileView({
  user,
  stats,
  recentOrders,
}: {
  user: UserData;
  stats: StatsData;
  recentOrders: RecentOrder[];
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Wallet}
          label="موجودی کیف پول"
          value={`${formatToman(stats.walletBalance)} ت`}
          tone="primary"
          href="/wallet"
        />
        <StatCard
          icon={ShoppingBag}
          label="کل سفارش‌ها"
          value={toFaDigits(stats.totalOrders)}
          tone="info"
          href="/orders"
        />
        <StatCard
          icon={TrendingUp}
          label="کل spending"
          value={`${formatToman(stats.totalSpent)} ت`}
          tone="success"
          href="/orders"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile info edit */}
        <ProfileEditCard user={user} />

        {/* Password change */}
        <PasswordChangeCard />
      </div>

      {/* Account info */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              اطلاعات حساب
            </h2>
            <p className="text-xs text-muted-foreground">
              جزئیات عضویت و امنیت
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow icon={Mail} label="ایمیل" value={user.email} />
          <InfoRow
            icon={UserIcon}
            label="نقش"
            value={user.role === "ADMIN" ? "مدیر سیستم" : "کاربر"}
          />
          <InfoRow
            icon={Calendar}
            label="عضو از"
            value={formatRelativeTime(user.createdAt)}
          />
          <InfoRow
            icon={Lock}
            label="رمز عبور"
            value="•••••••• (تغییر در کارت کنار)"
          />
        </div>
      </Card>

      {/* Recent orders preview */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            آخرین سفارش‌ها
          </h2>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            همه سفارش‌ها
            <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            هنوز سفارشی ثبت نکرده‌اید.
          </p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
              >
                <Link
                  href={`/orders/${o.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/40 hover:bg-accent/30"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-base">
                    {o.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {o.serviceName}
                      </span>
                      <span className="tnum text-[11px] tabular-nums text-muted-foreground">
                        {o.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(o.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={o.status as any} size="sm" />
                  <span className="tnum text-sm font-bold tabular-nums text-foreground">
                    {formatToman(o.totalAmount)}
                    <span className="mr-1 text-[10px] text-muted-foreground">ت</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Account deletion (GDPR) */}
      <DangerZoneCard userId={user.id} isAdmin={user.role === "ADMIN"} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "primary" | "info" | "success";
  href: string;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <Link href={href}>
      <Card className="flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            tones[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">{label}</div>
          <div className="tnum mt-0.5 truncate text-lg font-bold tabular-nums text-foreground">
            {value}
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ProfileEditCard({ user }: { user: UserData }) {
  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(d?.message ?? "ذخیره ناموفق بود.");
        return;
      }
      setSaved(true);
      toast.success("پروفایل به‌روزرسانی شد.");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserIcon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">پروفایل</h2>
          <p className="text-xs text-muted-foreground">ویرایش نام نمایشی</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs">
            نام نمایشی
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام شما"
            className="h-10"
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">ایمیل</Label>
          <div className="flex h-10 items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate text-sm text-muted-foreground">
              {user.email}
            </span>
            <span className="mr-auto text-[10px] text-muted-foreground">
              غیرقابل تغییر
            </span>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full gap-1.5"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "ذخیره شد" : "ذخیره"}
        </Button>
      </div>
    </Card>
  );
}

function PasswordChangeCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const passwordsMatch = next === confirm;
  const canSubmit =
    current.length > 0 &&
    next.length >= 8 &&
    confirm.length > 0 &&
    passwordsMatch;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const r = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: next,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(d?.message ?? "تغییر رمز ناموفق بود.");
        return;
      }
      toast.success("رمز عبور با موفقیت تغییر کرد.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">رمز عبور</h2>
          <p className="text-xs text-muted-foreground">تغییر رمز عبور حساب</p>
        </div>
      </div>
      <div className="space-y-4">
        <PasswordInput
          label="رمز فعلی"
          value={current}
          onChange={setCurrent}
          show={showCurrent}
          onToggle={() => setShowCurrent(!showCurrent)}
        />
        <PasswordInput
          label="رمز جدید"
          value={next}
          onChange={setNext}
          show={showNext}
          onToggle={() => setShowNext(!showNext)}
          hint={next.length > 0 && next.length < 8 ? "حداقل ۸ کاراکتر" : undefined}
        />
        <PasswordInput
          label="تکرار رمز جدید"
          value={confirm}
          onChange={setConfirm}
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
          hint={
            confirm.length > 0 && !passwordsMatch
              ? "تکرار رمز مطابقت ندارد"
              : undefined
          }
          error={confirm.length > 0 && !passwordsMatch}
        />
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="w-full gap-1.5"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          تغییر رمز
        </Button>
      </div>
    </Card>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  hint?: string;
  error?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("h-10 pl-10", error && "border-red-500/50")}
          dir="ltr"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label={show ? "پنهان کردن" : "نمایش"}
        >
          {show ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {hint && (
        <p
          className={cn(
            "text-[11px]",
            error ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium text-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}

function DangerZoneCard({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!password) return;
    if (!confirm("آیا مطمئن هستید؟ این عمل قابل بازگشت نیست و تمام داده‌های شما حذف خواهد شد.")) return;
    setDeleting(true);
    try {
      const r = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(d?.message ?? "حذف حساب ناموفق بود.");
        setDeleting(false);
        return;
      }
      toast.success("حساب شما حذف شد.");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
      setDeleting(false);
    }
  };

  return (
    <Card className="border-red-500/25 bg-red-500/[0.02] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">منطقه خطر</h2>
          <p className="text-xs text-muted-foreground">
            حذف دائمی حساب کاربری و تمام داده‌های مرتبط
          </p>
        </div>
      </div>

      {isAdmin ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.04] p-3 text-[11px] leading-5 text-amber-800 dark:text-amber-300">
          <ShieldCheck className="mb-1 ml-1 inline h-3.5 w-3.5" />
          حساب‌های مدیریت قابل حذف نیستند. برای حذف، ابتدا باید نقش خود را
          تغییر دهید یا از یک مدیر دیگر استفاده کنید.
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-lg bg-red-500/[0.04] p-3 text-[11px] leading-5 text-red-700 dark:text-red-400">
            با حذف حساب، تمام سفارش‌ها، کیف پول، تراکنش‌ها، تیکت‌ها، نظرات و
            داده‌های شما به‌طور دائمی حذف می‌شوند. این عمل قابل بازگشت نیست.
          </div>

          {!confirming ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirming(true)}
              className="gap-1.5 border-red-500/40 bg-red-500/5 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              حذف حساب کاربری
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-red-700 dark:text-red-400">
                  برای تأیید، رمز عبور خود را وارد کنید
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور"
                  dir="ltr"
                  className="h-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirming(false);
                    setPassword("");
                  }}
                  disabled={deleting}
                >
                  انصراف
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={!password || deleting}
                  className="gap-1.5"
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {deleting ? "در حال حذف..." : "حذف دائمی"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
