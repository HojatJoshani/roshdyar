"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TierBadge } from "@/components/brand/tier-badge";
import { Tier } from "@/lib/constants";
import { toFaDigits } from "@/lib/format";

export type TierRow = {
  id: string;
  tier: Tier;
  displayName: string;
  tagline: string;
  featuresCsv: string;
  pricePer1000: number;
  minQuantity: number;
  maxQuantity: number;
  step: number;
  deliveryEstimate: string;
  refillPolicy: string;
  refundPolicy: string;
  isActive: boolean;
};

export function TierEditDialog({
  tier,
  onSaved,
}: {
  tier: TierRow;
  onSaved?: (updated: TierRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TierRow>(tier);

  const update = <K extends keyof TierRow>(key: K, value: TierRow[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/services/${form.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          tagline: form.tagline,
          featuresCsv: form.featuresCsv,
          pricePer1000: Number(form.pricePer1000) || 0,
          minQuantity: Number(form.minQuantity) || 0,
          maxQuantity: Number(form.maxQuantity) || 0,
          step: Number(form.step) || 1,
          deliveryEstimate: form.deliveryEstimate,
          refillPolicy: form.refillPolicy,
          refundPolicy: form.refundPolicy,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.message || "ذخیره ناموفق بود.");
        return;
      }
      toast.success("ذخیره شد.");
      onSaved?.(form);
      setOpen(false);
    } catch {
      toast.error("خطای شبکه.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5"
        onClick={() => {
          setForm(tier);
          setOpen(true);
        }}
      >
        <Pencil className="h-3 w-3" />
        ویرایش
      </Button>
      <DialogContent className="max-w-2xl overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TierBadge tier={form.tier} size="sm" />
            ویرایش سطح {form.displayName}
          </DialogTitle>
          <DialogDescription>
            تغییرات قیمت و تنظیمات این سطح. سفارش‌های قبلی تحت تأثیر قرار نمی‌گیرند.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* isActive toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <div>
              <div className="text-sm font-medium">فعال بودن سطح</div>
              <div className="text-xs text-muted-foreground">
                غیرفعال کردن، این سطح را از انتخاب کاربران مخفی می‌کند.
              </div>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => update("isActive", v)}
            />
          </div>

          {/* Display name + tagline */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">نام نمایشی</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => update("displayName", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">شعار کوتاه</Label>
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Price + delivery */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pricePer1000">قیمت هر ۱٬۰۰۰ (تومان)</Label>
              <Input
                id="pricePer1000"
                type="number"
                dir="ltr"
                inputMode="numeric"
                value={form.pricePer1000}
                onChange={(e) => update("pricePer1000", Number(e.target.value) || 0)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deliveryEstimate">زمان تحویل تخمینی</Label>
              <Input
                id="deliveryEstimate"
                value={form.deliveryEstimate}
                onChange={(e) => update("deliveryEstimate", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Min / Max / Step */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="minQuantity">حداقل تعداد</Label>
              <Input
                id="minQuantity"
                type="number"
                dir="ltr"
                inputMode="numeric"
                value={form.minQuantity}
                onChange={(e) => update("minQuantity", Number(e.target.value) || 0)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxQuantity">حداکثر تعداد</Label>
              <Input
                id="maxQuantity"
                type="number"
                dir="ltr"
                inputMode="numeric"
                value={form.maxQuantity}
                onChange={(e) => update("maxQuantity", Number(e.target.value) || 0)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="step">گام</Label>
              <Input
                id="step"
                type="number"
                dir="ltr"
                inputMode="numeric"
                value={form.step}
                onChange={(e) => update("step", Number(e.target.value) || 1)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Policies */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="refillPolicy">سیاست ری‌فیل</Label>
              <Textarea
                id="refillPolicy"
                className="min-h-20"
                value={form.refillPolicy}
                onChange={(e) => update("refillPolicy", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="refundPolicy">سیاست بازگشت وجه</Label>
              <Textarea
                id="refundPolicy"
                className="min-h-20"
                value={form.refundPolicy}
                onChange={(e) => update("refundPolicy", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-1.5">
            <Label htmlFor="featuresCsv">امکانات (با ویرگول جدا کنید)</Label>
            <Textarea
              id="featuresCsv"
              className="min-h-20"
              value={form.featuresCsv}
              onChange={(e) => update("featuresCsv", e.target.value)}
              disabled={loading}
            />
            <p className="text-[11px] text-muted-foreground">
              مثال: کیفیت بالا، افت پایین، پشتیبانی ۲۴/۷
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
