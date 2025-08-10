import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { toFaDigits } from "@/lib/format";

/**
 * GET /api/orders/export
 * Exports the user's own orders as a CSV file (Persian headers, UTF-8 BOM
 * for Excel compatibility). Returns a text/csv response with
 * Content-Disposition: attachment; filename=...
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const headers = [
    "کد سفارش",
    "سرویس",
    "پلتفرم",
    "سطح",
    "تعداد",
    "قیمت هر ۱۰۰۰ (تومان)",
    "مبلغ کل (تومان)",
    "تخفیف (تومان)",
    "کد تخفیف",
    "وضعیت",
    "انجام‌شده",
    "لینک هدف",
    "تاریخ ثبت",
    "آخرین به‌روزرسانی",
  ];

  const escapeCsv = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // Escape double quotes by doubling them, wrap in quotes if contains comma/quote/newline
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = orders.map((o) => [
    o.code,
    o.serviceName,
    o.platform,
    o.tierDisplay,
    toFaDigits(o.quantity),
    toFaDigits(o.unitPricePer1000),
    toFaDigits(o.totalAmount),
    toFaDigits(o.discountAmount),
    o.promoCode ?? "",
    o.status,
    toFaDigits(o.completedCount),
    o.targetLink,
    new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(o.createdAt),
    new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(o.updatedAt),
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ].join("\r\n");

  // Prepend UTF-8 BOM so Excel reads Persian characters correctly
  const bom = "\uFEFF";
  const csvWithBom = bom + csv;

  const filename = `roshdgar-orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csvWithBom, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
