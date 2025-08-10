import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SiteShell } from "@/components/brand/site-shell";
import { ServiceBreadcrumb } from "@/components/brand/service-breadcrumb";
import { SupportList, type TicketRow } from "./support-list";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const session = await getSession();
  if (!session) redirect("/login?reason=auth&from=/support");

  const tickets = await db.supportTicket.findMany({
    where: { userId: session.id },
    orderBy: { updatedAt: "desc" },
    include: {
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          message: true,
          isStaff: true,
          createdAt: true,
          userId: true,
        },
      },
    },
    take: 100,
  });

  const rows: TicketRow[] = tickets.map((t) => {
    const lastReply = t.replies[t.replies.length - 1];
    return {
      id: t.id,
      code: t.code,
      subject: t.subject,
      category: t.category as "general" | "order" | "payment" | "other",
      status: t.status as "OPEN" | "ANSWERED" | "CLOSED",
      orderId: t.orderId ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      replyCount: t.replies.length,
      lastReplyAt: lastReply ? lastReply.createdAt.toISOString() : null,
      lastReplyIsStaff: lastReply ? lastReply.isStaff : false,
    };
  });

  const open = rows.filter((t) => t.status === "OPEN").length;
  const answered = rows.filter((t) => t.status === "ANSWERED").length;
  const closed = rows.filter((t) => t.status === "CLOSED").length;

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-mesh-brand">
        <div className="container mx-auto px-4 py-8">
          <ServiceBreadcrumb
            items={[
              { label: "خانه", href: "/" },
              { label: "پشتیبانی" },
            ]}
            className="mb-4"
          />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                پشتیبانی
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                تیکت‌های خود را اینجا ببینید و پاسخ‌ها را دنبال کنید. تیم
                پشتیبانی رشدیار در سریع‌ترین زمان ممکن پاسخگو است.
              </p>
            </div>
            <CountPill label="باز" value={open} tone="warning" />
            <CountPill label="پاسخ داده شده" value={answered} tone="success" />
            <CountPill label="بسته" value={closed} tone="neutral" />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-10">
        <SupportList tickets={rows} />
      </section>
    </SiteShell>
  );
}

function CountPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "warning" | "success";
}) {
  const toneClass = {
    neutral: "border-border bg-card text-muted-foreground",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${toneClass}`}
    >
      {label}
      <span className="tnum rounded-full bg-background/60 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
        {new Intl.NumberFormat("fa-IR").format(value)}
      </span>
    </span>
  );
}
