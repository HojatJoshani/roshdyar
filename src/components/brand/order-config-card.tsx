"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { TierBadge } from "@/components/brand/tier-badge";
import { type Tier } from "@/lib/constants";
import { formatToman, toFaDigits, toEnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Check,
  Minus,
  Plus,
  Link2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Star,
} from "lucide-react";

export interface OrderTier {
  id: string;
  tier: string;
  displayName: string;
  tagline: string;
  features: string[];
  pricePer1000: number;
  minQuantity: number;
  maxQuantity: number;
  step: number;
  deliveryEstimate: string;
}

const LINK_PLACEHOLDERS: Record<string, string> = {
  INSTAGRAM: "https://instagram.com/p/xxxxx",
  YOUTUBE: "https://youtube.com/watch?v=xxxxx",
};

/**
 * Sticky order configuration card.
 * Client-side: tier picker, quantity stepper + slider, link input,
 * live total, navigation to /order on submit.
 */
export function OrderConfigCard({
  serviceName,
  platform,
  tiers,
}: {
  serviceName: string;
  platform: string;
  tiers: OrderTier[];
}) {
  const router = useRouter();
  const defaultTier =
    tiers.find((t) => t.tier === "STANDARD") ?? tiers[0];

  const [selectedTierId, setSelectedTierId] = useState(defaultTier.id);
  const selectedTier =
    tiers.find((t) => t.id === selectedTierId) ?? defaultTier;

  const [quantity, setQuantity] = useState<number>(defaultTier.minQuantity);
  const [link, setLink] = useState("");

  const total = useMemo(
    () => Math.ceil((selectedTier.pricePer1000 * quantity) / 1000),
    [selectedTier, quantity]
  );

  const quantityValid = useMemo(() => {
    return (
      quantity >= selectedTier.minQuantity &&
      quantity <= selectedTier.maxQuantity &&
      quantity > 0
    );
  }, [quantity, selectedTier]);

  const linkValid = useMemo(() => {
    const v = link.trim();
    return /^https?:\/\/.+\..+/.test(v);
  }, [link]);

  const canSubmit = quantityValid && linkValid;

  const handleSelectTier = (t: OrderTier) => {
    setSelectedTierId(t.id);
    setQuantity((prev) => {
      if (prev < t.minQuantity) return t.minQuantity;
      if (prev > t.maxQuantity) return t.maxQuantity;
      return prev;
    });
  };

  const stepDown = () =>
    setQuantity((q) =>
      Math.max(selectedTier.minQuantity, q - selectedTier.step)
    );
  const stepUp = () =>
    setQuantity((q) =>
      Math.min(selectedTier.maxQuantity, q + selectedTier.step)
    );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const latin = toEnDigits(raw).replace(/[^\d]/g, "");
    if (latin === "") {
      setQuantity(0);
      return;
    }
    const n = parseInt(latin, 10);
    if (!Number.isNaN(n)) setQuantity(n);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const params = new URLSearchParams({
      serviceTierId: selectedTier.id,
      quantity: String(quantity),
      link: link.trim(),
    });
    router.push(`/order?${params.toString()}`);
  };

  const placeholder =
    LINK_PLACEHOLDERS[platform] ?? "https://...";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          سفارش این خدمت
        </h2>
        <span className="text-xs text-muted-foreground">
          {serviceName}
        </span>
      </div>

      {/* Tier selector */}
      <div className="mb-6">
        <div className="mb-2.5 flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            انتخاب سطح کیفی
          </label>
          <span className="text-[11px] text-muted-foreground">۳ گزینه</span>
        </div>
        <div className="space-y-2">
          {tiers.map((t) => {
            const isSelected = selectedTierId === t.id;
            const isRecommended = t.tier === "STANDARD";
            return (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => handleSelectTier(t)}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                  "relative w-full overflow-hidden rounded-xl border p-3.5 text-right transition-[border-color,background-color,box-shadow] duration-200 ease-out",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border bg-background hover:border-primary/30 hover:bg-accent/40"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <TierBadge tier={t.tier as Tier} size="sm" />
                      {isRecommended && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          پیشنهادی
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-foreground">
                      {t.displayName}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {t.tagline}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="tnum text-sm font-bold tabular-nums text-foreground">
                      {formatToman(t.pricePer1000)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ت / ۱٬۰۰۰
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  تحویل: {t.deliveryEstimate}
                </div>

                {/* Selected check */}
                {isSelected && (
                  <span className="absolute left-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-5">
        <div className="mb-2.5 flex items-center justify-between">
          <label
            htmlFor="qty-input"
            className="text-xs font-medium text-muted-foreground"
          >
            تعداد سفارش
          </label>
          <span className="text-[11px] text-muted-foreground">
            گام افزایش: {toFaDigits(selectedTier.step.toLocaleString("en-US"))}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-lg"
            onClick={stepDown}
            disabled={quantity <= selectedTier.minQuantity}
            aria-label="کاهش تعداد"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="qty-input"
            value={
              quantity > 0
                ? toFaDigits(quantity.toLocaleString("en-US"))
                : ""
            }
            onChange={handleInputChange}
            inputMode="numeric"
            dir="ltr"
            className="tnum h-10 rounded-lg border-border bg-background text-center text-sm font-semibold tabular-nums"
            placeholder="۰"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-lg"
            onClick={stepUp}
            disabled={quantity >= selectedTier.maxQuantity}
            aria-label="افزایش تعداد"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3">
          <Slider
            value={[quantity]}
            min={selectedTier.minQuantity}
            max={selectedTier.maxQuantity}
            step={selectedTier.step}
            onValueChange={(v) => setQuantity(v[0] ?? 0)}
            className="w-full"
          />
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="tnum">
              حداقل: {toFaDigits(selectedTier.minQuantity.toLocaleString("en-US"))}
            </span>
            <span className="tnum">
              حداکثر: {toFaDigits(selectedTier.maxQuantity.toLocaleString("en-US"))}
            </span>
          </div>
        </div>

        {!quantityValid && quantity > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />
            تعداد باید بین{" "}
            {toFaDigits(selectedTier.minQuantity.toLocaleString("en-US"))} و{" "}
            {toFaDigits(selectedTier.maxQuantity.toLocaleString("en-US"))} باشد.
          </p>
        )}
      </div>

      {/* Link input */}
      <div className="mb-5">
        <label
          htmlFor="link-input"
          className="mb-2.5 block text-xs font-medium text-muted-foreground"
        >
          لینک هدف
        </label>
        <div className="relative">
          <Link2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="link-input"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            dir="ltr"
            placeholder={placeholder}
            className="h-10 rounded-lg border-border bg-background pr-9 text-left text-sm placeholder:text-left placeholder:text-xs placeholder:text-muted-foreground/60"
          />
        </div>
        {link.length > 0 && !linkValid && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />
            لینک معتبر وارد کنید (با http یا https شروع شود).
          </p>
        )}
      </div>

      {/* Pricing summary */}
      <div className="mb-5 rounded-xl bg-muted/40 p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">قیمت هر ۱٬۰۰۰</span>
          <span className="tnum font-medium tabular-nums text-foreground">
            {formatToman(selectedTier.pricePer1000)}{" "}
            <span className="text-[10px] text-muted-foreground">تومان</span>
          </span>
        </div>
        <div className="my-2.5 h-px bg-border/60" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">مبلغ کل</span>
          <div className="text-end">
            <span className="tnum text-lg font-bold tabular-nums text-primary">
              {formatToman(total)}
            </span>
            <span className="mr-1 text-xs text-muted-foreground">تومان</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        size="lg"
        className="h-12 w-full gap-1.5 text-sm font-semibold shadow-soft"
      >
        <ShieldCheck className="h-4 w-4" />
        محاسبه قیمت و ادامه
      </Button>

      <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
        با کلیک بر ادامه، قوانین سرویس را می‌پذیرید.
      </p>
    </div>
  );
}
