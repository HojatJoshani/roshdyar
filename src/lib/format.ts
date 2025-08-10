// Persian utility helpers — formatting numbers, dates, currency.
// All amounts in the app are TOMAN integers. We format for display
// with Persian digits using a tiny toLocaleString('fa-IR') helper.

const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert any number/string's latin digits to Persian digits. */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => faDigits[Number(d)]);
}

/** Convert Persian digits to latin (for parsing user input). */
export function toEnDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String(faDigits.indexOf(d)));
}

/** Format integer TOMAN amount with thousands separators (Persian digits). */
export function formatToman(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(amount));
  return sign + toFaDigits(abs.toLocaleString("en-US"));
}

/** Short formatted amount, e.g. "۱.۲M" for compact display. */
export function formatTomanShort(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return toFaDigits((abs / 1_000_000_000).toFixed(1)) + " میلیارد";
  if (abs >= 1_000_000) return toFaDigits((abs / 1_000_000).toFixed(1)) + " میلیون";
  if (abs >= 1_000) return toFaDigits((abs / 1_000).toFixed(0)) + " هزار";
  return formatToman(amount);
}

/** Format a quantity (e.g. followers count) — supports compact form. */
export function formatQuantity(q: number): string {
  if (q >= 1_000_000) return toFaDigits((q / 1_000_000).toFixed(q % 1_000_000 === 0 ? 0 : 1)) + " م";
  if (q >= 1_000) return toFaDigits((q / 1_000).toFixed(q % 1_000 === 0 ? 0 : 1)) + " هزار";
  return toFaDigits(q);
}

/** Pretty relative time in Persian (e.g. "۳ ساعت پیش"). */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);

  if (diff < 60) return "همین حالا";
  if (diff < 3600) return toFaDigits(Math.floor(diff / 60)) + " دقیقه پیش";
  if (diff < 86400) return toFaDigits(Math.floor(diff / 3600)) + " ساعت پیش";
  if (diff < 2592000) return toFaDigits(Math.floor(diff / 86400)) + " روز پیش";
  if (diff < 31536000) return toFaDigits(Math.floor(diff / 2592000)) + " ماه پیش";
  return toFaDigits(Math.floor(diff / 31536000)) + " سال پیش";
}

/** Format a date as Persian-style: ۱۴ مرداد ۱۴۰۳، ۱۴:۳۲ */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return toFaDigits(d.toLocaleString());
  }
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return toFaDigits(d.toLocaleDateString());
  }
}

/** Persian-ify any string's digits + convert common latin words to a softer look. */
export function faify(input: string): string {
  return toFaDigits(input);
}

/** Generate a human-friendly order code: RG-XXXXXX (base32, no ambiguous chars). */
export function generateOrderCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `RG-${s}`;
}

export function generateTicketCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `TK-${s}`;
}
