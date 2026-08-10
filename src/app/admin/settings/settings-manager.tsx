"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  Check,
  Wrench,
  Wallet,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatToman, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Settings {
  "site.maintenanceMode": boolean;
  "site.maintenanceMessage": string;
  "site.defaultWalletCredit": number;
  "site.minOrderAmount": number;
  "site.maxOrderAmount": number;
}

export function SettingsManager({
  initialSettings,
}: {
  initialSettings: Settings;
}) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(d?.message ?? "ذخیره ناموفق بود.");
        return;
      }
      setSettings(d.settings);
      setSaved(true);
      toast.success("تنظیمات ذخیره شد.");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            تنظیمات سیستم
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            پیکربندی سراسری پلتفرم.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "ذخیره شد" : "ذخیره تغییرات"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Maintenance mode */}
        <Card
          className={cn(
            "p-5 sm:p-6 transition-colors",
            settings["site.maintenanceMode"] &&
              "border-amber-500/40 bg-amber-500/[0.03]"
          )}
        >
          <div className="mb-4 flex items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                settings["site.maintenanceMode"]
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-accent text-foreground"
              )}
            >
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                حالت تعمیرات
              </h2>
              <p className="text-xs text-muted-foreground">
                غیرفعال‌کردن موقت ثبت سفارش جدید
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <Label htmlFor="maintenance" className="text-xs font-medium">
                حالت تعمیرات
              </Label>
              <p className="text-[11px] text-muted-foreground">
                وقتی فعال است، کاربران نمی‌توانند سفارش جدید ثبت کنند.
              </p>
            </div>
            <Switch
              id="maintenance"
              checked={settings["site.maintenanceMode"]}
              onCheckedChange={(v) => update("site.maintenanceMode", v)}
            />
          </div>
          {settings["site.maintenanceMode"] && (
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="maintenance-msg" className="text-xs">
                پیام نمایش‌داده‌شده به کاربران
              </Label>
              <Textarea
                id="maintenance-msg"
                value={settings["site.maintenanceMessage"]}
                onChange={(e) => update("site.maintenanceMessage", e.target.value)}
                rows={2}
                maxLength={500}
              />
            </div>
          )}
        </Card>

        {/* Wallet / order limits */}
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                محدودیت‌های سفارش و کیف پول
              </h2>
              <p className="text-xs text-muted-foreground">
                مقادیر به تومان هستند.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">اعتبار خوش‌آمدگویی (تومان)</Label>
              <Input
                type="number"
                value={settings["site.defaultWalletCredit"]}
                onChange={(e) =>
                  update("site.defaultWalletCredit", Number(e.target.value))
                }
                min={0}
                max={10_000_000}
                className="h-10"
              />
              <p className="text-[10px] text-muted-foreground">
                اعتباری که به کاربران جدید در محیط توسعه داده می‌شود.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">حداقل مبلغ سفارش (تومان)</Label>
              <Input
                type="number"
                value={settings["site.minOrderAmount"]}
                onChange={(e) =>
                  update("site.minOrderAmount", Number(e.target.value))
                }
                min={0}
                className="h-10"
              />
              <p className="text-[10px] text-muted-foreground">
                حداقل مبلغ قابل‌پرداخت برای یک سفارش.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">حداکثر مبلغ سفارش (تومان)</Label>
              <Input
                type="number"
                value={settings["site.maxOrderAmount"]}
                onChange={(e) =>
                  update("site.maxOrderAmount", Number(e.target.value))
                }
                min={0}
                className="h-10"
              />
              <p className="text-[10px] text-muted-foreground">
                سقف مبلغ یک سفارش (برای جلوگیری از سوءاستفاده).
              </p>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card className="p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              خلاصه تنظیمات فعلی
            </h2>
          </div>
          <div className="space-y-2 text-xs">
            <Row
              label="حالت تعمیرات"
              value={
                settings["site.maintenanceMode"] ? (
                  <span className="text-amber-600 dark:text-amber-400">فعال</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">غیرفعال</span>
                )
              }
            />
            <Row
              label="اعتبار خوش‌آمدگویی"
              value={`${formatToman(settings["site.defaultWalletCredit"])} ت`}
            />
            <Row
              label="حداقل سفارش"
              value={`${formatToman(settings["site.minOrderAmount"])} ت`}
            />
            <Row
              label="حداکثر سفارش"
              value={`${formatToman(settings["site.maxOrderAmount"])} ت`}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-1.5 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
