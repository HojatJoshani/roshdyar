"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatRelativeTime, toFaDigits } from "@/lib/format";
import { StatusBadge } from "@/components/brand/status-badge";
import {
  Send,
  Loader2,
  ArrowRight,
  Hash,
  PackageSearch,
  Tag,
  CreditCard,
  MessageCircle,
  ChevronDown,
  Check,
  X,
} from "lucide-react";

export type OrderOption = {
  id: string;
  code: string;
  serviceName: string;
  emoji: string;
  status:
    | "PENDING"
    | "PAYMENT_CONFIRMED"
    | "PROCESSING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "PARTIAL"
    | "FAILED";
  createdAt: string;
};

type Category = "general" | "order" | "payment" | "other";

const CATEGORY_OPTIONS: { value: Category; label: string; Icon: typeof Tag }[] = [
  { value: "general", label: "عمومی", Icon: Tag },
  { value: "order", label: "سفارش", Icon: PackageSearch },
  { value: "payment", label: "پرداخت", Icon: CreditCard },
  { value: "other", label: "سایر", Icon: MessageCircle },
];

const schema = z.object({
  subject: z.string().trim().min(3, "موضوع حداقل ۳ کاراکتر باشد").max(120, "موضوع خیلی طولانی است"),
  category: z.enum(["general", "order", "payment", "other"]),
  orderId: z.string().optional(),
  message: z.string().trim().min(5, "متن پیام حداقل ۵ کاراکتر باشد").max(4000, "متن پیام خیلی طولانی است"),
});

type FormValues = z.infer<typeof schema>;

export function NewTicketForm({
  orderOptions,
  initial,
}: {
  orderOptions: OrderOption[];
  initial: {
    orderId: string;
    subject: string;
    category: Category;
  };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: initial.subject,
      category: initial.category,
      orderId: initial.orderId || undefined,
      message: "",
    },
  });

  const { register, handleSubmit, watch, setValue, formState } = form;
  const selectedOrderId = watch("orderId");
  const selectedOrder = orderOptions.find((o) => o.id === selectedOrderId);

  const filteredOrders = orderOptions.filter(
    (o) =>
      o.serviceName.includes(orderSearch) ||
      o.code.toLowerCase().includes(orderSearch.toLowerCase())
  );

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const r = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: values.subject,
          category: values.category,
          message: values.message,
          orderId: values.orderId || undefined,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast({
          title: "خطا در ثبت تیکت",
          description:
            data?.error === "INVALID_INPUT"
              ? "ورودی‌ها نامعتبر است."
              : "ثبت تیکت ناموفق بود. لطفاً دوباره تلاش کنید.",
          variant: "destructive",
        });
        return;
      }
      if (data?.ticket?.id) {
        toast({
          title: "تیکت ثبت شد",
          description: "به‌زودی پاسخ شما را دریافت خواهید کرد.",
        });
        router.push(`/support/${data.ticket.id}`);
      }
    } catch {
      toast({
        title: "خطای شبکه",
        description: "اتصال به سرور ناموفق بود.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Subject */}
        <Field
          label="موضوع تیکت"
          htmlFor="subject"
          hint="عنوانی کوتاه و گویا برای مسئله‌ای که نیاز به کمک دارید."
          error={formState.errors.subject?.message}
        >
          <Input
            id="subject"
            placeholder="مثلاً: سفارش من تکمیل نشده است"
            className="h-11"
            maxLength={120}
            {...register("subject")}
          />
        </Field>

        {/* Category */}
        <Field label="دسته‌بندی" htmlFor="category" hint="برای پاسخ سریع‌تر، دسته مرتبط را انتخاب کنید.">
          <Select
            value={watch("category")}
            onValueChange={(v) => setValue("category", v as Category, { shouldValidate: true })}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="انتخاب دسته" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => {
                const Icon = opt.Icon;
                return (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {opt.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </Field>

        {/* Order picker (optional, only if there are recent orders) */}
        {orderOptions.length > 0 && (
          <Field
            label="سفارش مرتبط (اختیاری)"
            hint="اگر تیکت مربوط به سفارش خاصی است، آن را انتخاب کنید."
          >
            <input type="hidden" {...register("orderId")} />
            <Popover open={orderPickerOpen} onOpenChange={setOrderPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-right text-sm shadow-xs transition-[color,box-shadow] outline-none hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  {selectedOrder ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="text-base">{selectedOrder.emoji}</span>
                      <span className="truncate text-foreground">
                        {selectedOrder.serviceName}
                      </span>
                      <span className="inline-flex items-center gap-0.5 font-mono text-[11px] text-muted-foreground">
                        <Hash className="h-2.5 w-2.5" />
                        {selectedOrder.code}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">بدون انتخاب سفارش…</span>
                  )}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="border-b border-border/60 p-2">
                  <Input
                    placeholder="جستجوی سفارش…"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setValue("orderId", undefined, { shouldValidate: true });
                      setOrderPickerOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
                    )}
                  >
                    <span>بدون انتخاب سفارش</span>
                    {!selectedOrderId && <Check className="h-4 w-4 text-primary" />}
                  </button>
                  {filteredOrders.length === 0 ? (
                    <p className="px-2.5 py-3 text-center text-xs text-muted-foreground">
                      سفارشی یافت نشد.
                    </p>
                  ) : (
                    filteredOrders.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setValue("orderId", o.id, { shouldValidate: true });
                          setOrderPickerOpen(false);
                          setOrderSearch("");
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-right text-sm transition-colors hover:bg-accent"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="text-base">{o.emoji}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-foreground">
                              {o.serviceName}
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center gap-0.5 font-mono">
                                <Hash className="h-2.5 w-2.5" />
                                {o.code}
                              </span>
                              <span className="text-muted-foreground/50">•</span>
                              <span>{formatRelativeTime(o.createdAt)}</span>
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={o.status} size="sm" />
                          {selectedOrderId === o.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {selectedOrderId && (
              <button
                type="button"
                onClick={() => setValue("orderId", undefined, { shouldValidate: true })}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                حذف سفارش مرتبط
              </button>
            )}
          </Field>
        )}

        {/* Message */}
        <Field
          label="متن پیام"
          htmlFor="message"
          hint="مشکل یا سؤال خود را با جزئیات کامل شرح دهید."
          error={formState.errors.message?.message}
        >
          <Textarea
            id="message"
            placeholder="سلام، من دیروز یک سفارش ثبت کردم اما…"
            className="min-h-32 resize-y leading-7"
            maxLength={4000}
            {...register("message")}
          />
          <span className="mt-1 block text-left text-[11px] text-muted-foreground">
            <span className="tnum tabular-nums">
              {toFaDigits((watch("message") ?? "").length)}
            </span>{" "}
            / ۴۰۰۰
          </span>
        </Field>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:justify-start">
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="h-12 flex-1 gap-2 font-semibold shadow-soft sm:flex-none sm:px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال ارسال…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                ارسال تیکت
              </>
            )}
          </Button>
          <Link
            href="/support"
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <ArrowRight className="h-4 w-4 rtl-flip" />
            انصراف
          </Link>
        </div>
      </form>

      {/* Help footer */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="mt-8 rounded-2xl border border-border bg-muted/30 p-4 text-xs leading-6 text-muted-foreground"
      >
        <span className="font-medium text-foreground">پاسخ سریع‌تر:</span>{" "}
        برای تسریع در پاسخگویی، کد سفارش مرتبط را انتخاب کنید و در متن پیام به
        جزئیات مانند زمان وقوع مشکل، پیام خطا یا لینک حساب اشاره کنید.
      </motion.div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
