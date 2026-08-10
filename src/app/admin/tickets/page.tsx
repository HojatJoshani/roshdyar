import Link from "next/link";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, toFaDigits } from "@/lib/format";
import { MessageSquare, Reply } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const tickets = await db.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      user: { select: { email: true, name: true } },
      _count: { select: { replies: true } },
    },
  });

  const open = tickets.filter((t) => t.status === "OPEN").length;
  const answered = tickets.filter((t) => t.status === "ANSWERED").length;
  const closed = tickets.filter((t) => t.status === "CLOSED").length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">تیکت‌ها</h1>
        <p className="text-sm text-muted-foreground">
          لیست همه تیکت‌های پشتیبانی کاربران.
        </p>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="text-[11px] text-muted-foreground">باز</div>
            <div className="mt-1 text-xl font-bold tnum text-amber-600 dark:text-amber-400">
              {toFaDigits(open)}
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="text-[11px] text-muted-foreground">پاسخ داده شده</div>
            <div className="mt-1 text-xl font-bold tnum text-emerald-600 dark:text-emerald-400">
              {toFaDigits(answered)}
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="text-[11px] text-muted-foreground">بسته</div>
            <div className="mt-1 text-xl font-bold tnum text-muted-foreground">
              {toFaDigits(closed)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="py-0">
        <CardHeader className="border-b border-border/60 py-4">
          <CardTitle className="text-base">آخرین تیکت‌ها</CardTitle>
          <CardDescription className="text-xs">
            {toFaDigits(tickets.length)} تیکت
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-40" />
              هنوز تیکتی ثبت نشده است.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pr-4">کد</TableHead>
                  <TableHead>موضوع</TableHead>
                  <TableHead>کاربر</TableHead>
                  <TableHead>دسته</TableHead>
                  <TableHead className="text-center">پاسخ‌ها</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>آخرین فعالیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="pr-4">
                      <Link
                        href={`/support/${t.id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {t.code}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-64">
                      <Link
                        href={`/support/${t.id}`}
                        className="block truncate text-xs font-medium hover:text-primary"
                      >
                        {t.subject}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-44">
                      <div className="truncate text-xs">{t.user?.name || "—"}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {t.user?.email || ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {t.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tnum tabular-nums">
                        <Reply className="h-3 w-3" />
                        {toFaDigits(t._count.replies)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {t.status === "OPEN" && (
                        <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                          باز
                        </Badge>
                      )}
                      {t.status === "ANSWERED" && (
                        <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                          پاسخ داده شده
                        </Badge>
                      )}
                      {t.status === "CLOSED" && (
                        <Badge variant="secondary" className="gap-1">
                          بسته
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeTime(t.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
