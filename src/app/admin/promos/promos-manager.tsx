"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Power,
  Loader2,
  Percent,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { formatToman, formatDateTime, toFaDigits } from "@/lib/format";
import { PromoSparkline } from "@/components/brand/promo-sparkline";
import { cn } from "@/lib/utils";

export interface PromoRow {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  appliesTo: string;
  maxUses: number;
  usedCount: number;
  redemptionCount: number;
  perUserLimit: number;
  minOrderAmount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  sparkline: Array<{ date: string; count: number }>;
}

type FormData = {
  code: string;
  description: string;
  type: "PERCENT" | "FIXED";
  value: string;
  appliesTo: string;
  maxUses: string;
  perUserLimit: string;
  minOrderAmount: string;
  expiresAt: string;
  isActive: boolean;
};

const EMPTY_FORM: FormData = {
  code: "",
  description: "",
  type: "PERCENT",
  value: "10",
  appliesTo: "ALL",
  maxUses: "0",
  perUserLimit: "1",
  minOrderAmount: "0",
  expiresAt: "",
  isActive: true,
};

export function PromosManager({ initialPromos }: { initialPromos: PromoRow[] }) {
  const [promos, setPromos] = useState<PromoRow[]>(initialPromos);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PromoRow | null>(null);

  const refresh = async () => {
    const r = await fetch("/api/admin/promos", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      setPromos(d.promos);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            کدهای تخفیف
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ساخت و مدیریت کدهای تخفیف. سفارش‌های قبلی تحت تأثیر قرار نمی‌گیرند.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 shadow-soft">
          <Plus className="h-4 w-4" />
          کد تخفیف جدید
        </Button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="کل کدها" value={promos.length} icon={Ticket} tone="primary" />
        <KpiCard
          label="فعال"
          value={promos.filter((p) => p.isActive).length}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="غیرفعال"
          value={promos.filter((p) => !p.isActive).length}
          icon={XCircle}
          tone="muted"
        />
        <KpiCard
          label="کل استفاده"
          value={promos.reduce((s, p) => s + p.redemptionCount, 0)}
          icon={Clock}
          tone="info"
        />
      </div>

      {/* List */}
      {promos.length === 0 ? (
        <Card className="p-12 text-center">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-3 text-base font-semibold text-foreground">
            هنوز کد تخفیفی ساخته نشده
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            اولین کد تخفیف را برای کاربران خود بسازید.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-1.5">
            <Plus className="h-4 w-4" />
            ساخت کد
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence initial={false}>
            {promos.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18 }}
              >
                <PromoCard
                  promo={p}
                  onEdit={() => setEditing(p)}
                  onRefresh={refresh}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create dialog */}
      <PromoFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSaved={async () => {
          await refresh();
          setCreateOpen(false);
        }}
      />

      {/* Edit dialog */}
      <PromoFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        mode="edit"
        initial={editing}
        onSaved={async () => {
          await refresh();
          setEditing(null);
        }}
      />
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
  tone: "primary" | "success" | "muted" | "info";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    muted: "bg-muted text-muted-foreground",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
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

function PromoCard({
  promo,
  onEdit,
  onRefresh,
}: {
  promo: PromoRow;
  onEdit: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isExpired = promo.expiresAt && new Date(promo.expiresAt) < new Date();
  const usagePct =
    promo.maxUses > 0 ? Math.min(100, (promo.usedCount / promo.maxUses) * 100) : 0;

  const toggle = async () => {
    setToggling(true);
    try {
      const r = await fetch(`/api/admin/promos/${promo.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      if (!r.ok) throw new Error();
      toast.success(
        promo.isActive ? "کد غیرفعال شد." : "کد فعال شد."
      );
      await onRefresh();
    } catch {
      toast.error("عملیات ناموفق بود.");
    } finally {
      setToggling(false);
    }
  };

  const remove = async () => {
    if (!confirm(`حذف کد «${promo.code}»؟ (سابقه استفاده‌ها حفظ می‌شود)`)) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/admin/promos/${promo.id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error();
      toast.success("کد حذف شد.");
      await onRefresh();
    } catch {
      toast.error("حذف ناموفق بود.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className={cn("overflow-hidden p-0", !promo.isActive && "opacity-60")}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        {/* Code + type */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              promo.type === "PERCENT"
                ? "bg-primary/10 text-primary"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}
          >
            {promo.type === "PERCENT" ? (
              <Percent className="h-5 w-5" />
            ) : (
              <Coins className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tnum font-mono text-base font-bold tracking-wide text-foreground">
                {promo.code}
              </span>
              {promo.isActive ? (
                <Badge className="bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/12 dark:text-emerald-400">
                  فعال
                </Badge>
              ) : (
                <Badge variant="secondary">غیرفعال</Badge>
              )}
              {isExpired && (
                <Badge className="bg-red-500/12 text-red-700 hover:bg-red-500/12 dark:text-red-400">
                  منقضی
                </Badge>
              )}
            </div>
            {promo.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {promo.description}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              <span>
                {promo.type === "PERCENT"
                  ? `${toFaDigits(promo.value)}٪ تخفیف`
                  : `${formatToman(promo.value)} تومان تخفیف`}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span>
                محدوده:{" "}
                {promo.appliesTo === "ALL"
                  ? "همه"
                  : promo.appliesTo === "INSTAGRAM"
                    ? "اینستاگرام"
                    : promo.appliesTo === "YOUTUBE"
                      ? "یوتیوب"
                      : promo.appliesTo}
              </span>
              {promo.minOrderAmount > 0 && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span>
                    حداقل سفارش: {formatToman(promo.minOrderAmount)} ت
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Usage stats */}
        <div className="flex shrink-0 items-center gap-5 sm:flex-col sm:items-end sm:gap-1">
          <div className="text-end">
            <div className="tnum text-sm font-semibold tabular-nums text-foreground">
              {toFaDigits(promo.redemptionCount)}
              {promo.maxUses > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  / {toFaDigits(promo.maxUses)}
                </span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground">استفاده</div>
            {promo.maxUses > 0 && (
              <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sparkline — 14-day redemption trend */}
        {promo.redemptionCount > 0 && (
          <div className="mt-3 border-t border-border/60 pt-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                روند استفاده (۱۴ روز)
              </span>
            </div>
            <PromoSparkline data={promo.sparkline} />
          </div>
        )}

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onEdit}
            aria-label="ویرایش"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={toggle}
            disabled={toggling}
            aria-label={promo.isActive ? "غیرفعال‌کردن" : "فعال‌کردن"}
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-red-600 hover:text-red-700 dark:text-red-400"
            onClick={remove}
            disabled={deleting}
            aria-label="حذف"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      {(promo.expiresAt || promo.perUserLimit > 0) && (
        <div className="border-t border-border/60 bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground sm:px-5">
          {promo.expiresAt && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              انقضا: {formatDateTime(promo.expiresAt)}
            </span>
          )}
          {promo.perUserLimit > 0 && (
            <span className="mr-3">
              • سقف هر کاربر: {toFaDigits(promo.perUserLimit)} بار
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

function PromoFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "create" | "edit";
  initial?: PromoRow | null;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Sync form when dialog opens
  useState(() => {
    if (open && mode === "edit" && initial) {
      setForm({
        code: initial.code,
        description: initial.description ?? "",
        type: initial.type,
        value: String(initial.value),
        appliesTo: initial.appliesTo,
        maxUses: String(initial.maxUses),
        perUserLimit: String(initial.perUserLimit),
        minOrderAmount: String(initial.minOrderAmount),
        expiresAt: initial.expiresAt
          ? initial.expiresAt.slice(0, 16)
          : "",
        isActive: initial.isActive,
      });
    } else if (open && mode === "create") {
      setForm(EMPTY_FORM);
    }
  });

  const submit = async () => {
    setSaving(true);
    try {
      const payload: any = {
        description: form.description,
        type: form.type,
        value: Number(form.value),
        appliesTo: form.appliesTo,
        maxUses: Number(form.maxUses),
        perUserLimit: Number(form.perUserLimit),
        minOrderAmount: Number(form.minOrderAmount),
        expiresAt: form.expiresAt,
        isActive: form.isActive,
      };
      if (mode === "create") payload.code = form.code;

      const url =
        mode === "create"
          ? "/api/admin/promos"
          : `/api/admin/promos/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const r = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(d?.message ?? "ذخیره ناموفق بود.");
        return;
      }
      toast.success(
        mode === "create" ? "کد تخفیف ساخته شد." : "تغییرات ذخیره شد."
      );
      await onSaved();
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "ساخت کد تخفیف" : "ویرایش کد تخفیف"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "یک کد تخفیف جدید برای کاربران تعریف کنید."
              : `ویرایش کد ${initial?.code}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Code */}
          <div className="space-y-1.5">
            <Label htmlFor="promo-code" className="text-xs">
              کد تخفیف <span className="text-red-500">*</span>
            </Label>
            <Input
              id="promo-code"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                })
              }
              placeholder="مثلاً SUMMER20"
              dir="ltr"
              className="font-mono"
              disabled={mode === "edit"}
              maxLength={40}
            />
            {mode === "create" && (
              <p className="text-[11px] text-muted-foreground">
                فقط حروف انگلیسی بزرگ، عدد و خط تیره.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="promo-desc" className="text-xs">
              توضیحات (اختیاری)
            </Label>
            <Textarea
              id="promo-desc"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="توضیح کوتاه برای کاربران"
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">نوع تخفیف</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    type: v as "PERCENT" | "FIXED",
                    value:
                      v === "PERCENT" ? "10" : "5000",
                  })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">درصدی (٪)</SelectItem>
                  <SelectItem value="FIXED">مبلغ ثابت (تومان)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promo-value" className="text-xs">
                مقدار {form.type === "PERCENT" ? "(٪)" : "(تومان)"}
              </Label>
              <Input
                id="promo-value"
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                min={1}
                max={form.type === "PERCENT" ? 100 : undefined}
                className="h-10"
              />
            </div>
          </div>

          {/* Applies to */}
          <div className="space-y-1.5">
            <Label className="text-xs">محدوده اعمال</Label>
            <Select
              value={form.appliesTo}
              onValueChange={(v) => setForm({ ...form, appliesTo: v })}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">همه سرویس‌ها</SelectItem>
                <SelectItem value="INSTAGRAM">فقط اینستاگرام</SelectItem>
                <SelectItem value="YOUTUBE">فقط یوتیوب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Constraints */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="promo-max" className="text-xs">
                سقف کل استفاده
              </Label>
              <Input
                id="promo-max"
                type="number"
                value={form.maxUses}
                onChange={(e) =>
                  setForm({ ...form, maxUses: e.target.value })
                }
                min={0}
                className="h-10"
              />
              <p className="text-[10px] text-muted-foreground">۰ = نامحدود</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promo-per" className="text-xs">
                سقف هر کاربر
              </Label>
              <Input
                id="promo-per"
                type="number"
                value={form.perUserLimit}
                onChange={(e) =>
                  setForm({ ...form, perUserLimit: e.target.value })
                }
                min={0}
                className="h-10"
              />
              <p className="text-[10px] text-muted-foreground">۰ = نامحدود</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promo-min" className="text-xs">
                حداقل سفارش (ت)
              </Label>
              <Input
                id="promo-min"
                type="number"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm({ ...form, minOrderAmount: e.target.value })
                }
                min={0}
                className="h-10"
              />
              <p className="text-[10px] text-muted-foreground">۰ = بدون حداقل</p>
            </div>
          </div>

          {/* Expiry */}
          <div className="space-y-1.5">
            <Label htmlFor="promo-exp" className="text-xs">
              تاریخ انقضا (اختیاری)
            </Label>
            <Input
              id="promo-exp"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) =>
                setForm({ ...form, expiresAt: e.target.value })
              }
              className="h-10"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <Label htmlFor="promo-active" className="text-xs font-medium">
                فعال
              </Label>
              <p className="text-[11px] text-muted-foreground">
                کد غیرفعال برای کاربران قابل استفاده نیست.
              </p>
            </div>
            <Switch
              id="promo-active"
              checked={form.isActive}
              onCheckedChange={(c) => setForm({ ...form, isActive: c })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            انصراف
          </Button>
          <Button onClick={submit} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "ساخت کد" : "ذخیره تغییرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
