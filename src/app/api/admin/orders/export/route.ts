import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { toFaDigits } from "@/lib/format";

/**
 * GET /api/admin/orders/export
 * Admin-only — exports ALL orders as CSV (with user email column).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  const headers = [
    "کد سفارش",
    "کاربر",
    "ایمیل",
    "سرویس",
    "پلتفرم",
    "سطح",
    "تعداد",
    "مبلغ کل (تومان)",
    "تخفیف (تومان)",
    "کد تخفیف",
    "وضعیت",
    "انجام‌شده",
    "لینک هدف",
    "تاریخ ثبت",
  ];

  const escapeCsv = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = orders.map((o) => [
    o.code,
    o.user.name ?? "",
    o.user.email,
    o.serviceName,
    o.platform,
    o.tierDisplay,
    toFaDigits(o.quantity),
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
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ].join("\r\n");

  const bom = "\uFEFF";
  const csvWithBom = bom + csv;

  const filename = `roshdgar-all-orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csvWithBom, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
