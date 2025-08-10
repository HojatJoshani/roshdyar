"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ShoppingBag,
  LifeBuoy,
  Package,
  ArrowLeft,
  Hash,
  X,
} from "lucide-react";
import { formatToman, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ServiceResult {
  type: "service";
  id: string;
  slug: string;
  name: string;
  emoji: string;
  platform: string;
  summary: string;
  priceFrom: number | null;
}

interface OrderResult {
  type: "order";
  id: string;
  code: string;
  serviceName: string;
  emoji: string;
  status: string;
  totalAmount: number;
}

interface TicketResult {
  type: "ticket";
  id: string;
  code: string;
  subject: string;
  status: string;
}

interface Results {
  services: ServiceResult[];
  orders: OrderResult[];
  tickets: TicketResult[];
  total: number;
}

export function SearchCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { cache: "no-store" }
        );
        if (r.ok) {
          const d = await r.json();
          setResults(d);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(null);
    }
  }, [open]);

  // Keyboard: Esc to close (Dialog handles this), Enter to go to first result
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results) {
      if (results.services.length > 0) {
        router.push(`/services/${results.services[0].slug}`);
        onOpenChange(false);
      } else if (results.orders.length > 0) {
        router.push(`/orders/${results.orders[0].id}`);
        onOpenChange(false);
      } else if (results.tickets.length > 0) {
        router.push(`/support/${results.tickets[0].id}`);
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">جستجوی سراسری</DialogTitle>
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="جستجوی سرویس، سفارش یا تیکت…"
            className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="پاک کردن"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden shrink-0 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:block">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query.trim() ? (
            <EmptyHint />
          ) : loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : !results || results.total === 0 ? (
            <div className="px-6 py-10 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-medium text-foreground">
                نتیجه‌ای یافت نشد
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                برای «{query}» چیزی پیدا نشد. عبارت دیگری امتحان کنید.
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-2">
              {results.services.length > 0 && (
                <ResultGroup
                  icon={Package}
                  label="سرویس‌ها"
                  count={results.services.length}
                >
                  {results.services.map((s) => (
                    <ResultRow
                      key={s.id}
                      href={`/services/${s.slug}`}
                      onClick={() => onOpenChange(false)}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-base">
                        {s.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">
                          {s.name}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {s.summary}
                        </div>
                      </div>
                      {s.priceFrom !== null && (
                        <span className="tnum shrink-0 text-[11px] text-muted-foreground">
                          از {formatToman(s.priceFrom)} ت
                        </span>
                      )}
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}

              {results.orders.length > 0 && (
                <ResultGroup
                  icon={ShoppingBag}
                  label="سفارش‌های من"
                  count={results.orders.length}
                >
                  {results.orders.map((o) => (
                    <ResultRow
                      key={o.id}
                      href={`/orders/${o.id}`}
                      onClick={() => onOpenChange(false)}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-base">
                        {o.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-foreground">
                            {o.serviceName}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Hash className="h-2.5 w-2.5" />
                            <span className="tnum tabular-nums">{o.code}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {statusLabel(o.status)}
                        </div>
                      </div>
                      <span className="tnum shrink-0 text-[11px] font-medium tabular-nums text-foreground">
                        {formatToman(o.totalAmount)} ت
                      </span>
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}

              {results.tickets.length > 0 && (
                <ResultGroup
                  icon={LifeBuoy}
                  label="تیکت‌ها"
                  count={results.tickets.length}
                >
                  {results.tickets.map((t) => (
                    <ResultRow
                      key={t.id}
                      href={`/support/${t.id}`}
                      onClick={() => onOpenChange(false)}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-base">
                        <LifeBuoy className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-foreground">
                            {t.subject}
                          </span>
                          <span className="tnum text-[10px] tabular-nums text-muted-foreground">
                            {t.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {ticketStatusLabel(t.status)}
                        </div>
                      </div>
                    </ResultRow>
                  ))}
                </ResultGroup>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {results && results.total > 0 && (
          <div className="border-t border-border/60 px-4 py-2 text-[10px] text-muted-foreground">
            <span className="tnum">{toFaDigits(results.total)}</span> نتیجه —{" "}
            <span>برای رفتن به اولین نتیجه، Enter را بزنید</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmptyHint() {
  return (
    <div className="px-6 py-8 text-center">
      <Search className="mx-auto h-8 w-8 text-muted-foreground/40" />
      <p className="mt-2 text-sm font-medium text-foreground">
        چه چیزی را جستجو می‌کنید؟
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        سرویس‌ها، سفارش‌های شما و تیکت‌های پشتیبانی را جستجو کنید.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
        {["فالوور", "لایک", "یوتیوب", "RG-"].map((s) => (
          <span
            key={s}
            className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResultGroup({
  icon: Icon,
  label,
  count,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 px-2">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-muted-foreground">
          {label}
        </span>
        <span className="tnum text-[10px] tabular-nums text-muted-foreground/60">
          ({toFaDigits(count)})
        </span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ResultRow({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60"
    >
      {children}
      <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary rtl-flip" />
    </Link>
  );
}

function statusLabel(status: string): string {
  const m: Record<string, string> = {
    PENDING: "در انتظار پرداخت",
    PAYMENT_CONFIRMED: "پرداخت تأیید شد",
    PROCESSING: "در حال ارسال",
    IN_PROGRESS: "در حال انجام",
    COMPLETED: "تکمیل شد",
    PARTIAL: "ناقص",
    FAILED: "ناموفق",
  };
  return m[status] ?? status;
}

function ticketStatusLabel(status: string): string {
  const m: Record<string, string> = {
    OPEN: "باز",
    ANSWERED: "پاسخ داده شده",
    CLOSED: "بسته",
  };
  return m[status] ?? status;
}
