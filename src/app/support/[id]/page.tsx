import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SiteShell } from "@/components/brand/site-shell";
import { ServiceBreadcrumb } from "@/components/brand/service-breadcrumb";
import {
  TicketThread,
  type TicketData,
  type TicketReply,
} from "./ticket-thread";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/login?reason=auth&from=${encodeURIComponent(`/support/${id}`)}`);
  }

  const ticket = await db.supportTicket.findFirst({
    where: {
      AND: [{ id }, { OR: [{ userId: session.id }, { user: { role: "ADMIN" } }] }],
    },
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
  });

  if (!ticket) {
    notFound();
  }

  // Strip provider-only fields — none sensitive here, but we type narrow it.
  const replies: TicketReply[] = ticket.replies.map((r) => ({
    id: r.id,
    message: r.message,
    isStaff: r.isStaff,
    createdAt: r.createdAt.toISOString(),
    userId: r.userId,
  }));

  const data: TicketData = {
    id: ticket.id,
    code: ticket.code,
    subject: ticket.subject,
    category: ticket.category as "general" | "order" | "payment" | "other",
    status: ticket.status as "OPEN" | "ANSWERED" | "CLOSED",
    orderId: ticket.orderId ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    replies,
  };

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-mesh-brand">
        <div className="container mx-auto px-4 py-7">
          <ServiceBreadcrumb
            items={[
              { label: "خانه", href: "/" },
              { label: "پشتیبانی", href: "/support" },
              { label: ticket.code },
            ]}
            className="mb-4"
          />
        </div>
      </section>

      <section className="container mx-auto px-4 py-6 md:py-10">
        <TicketThread ticket={data} currentUserId={session.id} />
      </section>
    </SiteShell>
  );
}
