import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SiteShell } from "@/components/brand/site-shell";
import { ServiceBreadcrumb } from "@/components/brand/service-breadcrumb";
import { NewTicketForm, type OrderOption } from "./new-ticket-form";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    orderId?: string;
    subject?: string;
    category?: string;
  }>;
}

export default async function NewTicketPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login?reason=auth&from=/support/new");

  const sp = await searchParams;

  // Recent orders for the order picker (autocomplete)
  const recentOrders = await db.order.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      code: true,
      serviceName: true,
      emoji: true,
      status: true,
      createdAt: true,
    },
  });

  const orderOptions: OrderOption[] = recentOrders.map((o) => ({
    id: o.id,
    code: o.code,
    serviceName: o.serviceName,
    emoji: o.emoji,
    status: o.status as "PENDING" | "PAYMENT_CONFIRMED" | "PROCESSING" | "IN_PROGRESS" | "COMPLETED" | "PARTIAL" | "FAILED",
    createdAt: o.createdAt.toISOString(),
  }));

  // Pre-fill from query (used by order page CTA)
  const initial = {
    orderId: sp.orderId && orderOptions.some((o) => o.id === sp.orderId) ? sp.orderId : "",
    subject: sp.subject ?? "",
    category: (["general", "order", "payment", "other"].includes(sp.category ?? "") ? sp.category : "general") as
      | "general" | "order" | "payment" | "other",
  };

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-mesh-brand">
        <div className="container mx-auto px-4 py-8">
          <ServiceBreadcrumb
            items={[
              { label: "خانه", href: "/" },
              { label: "پشتیبانی", href: "/support" },
              { label: "تیکت جدید" },
            ]}
            className="mb-4"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              تیکت جدید
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              سؤال یا مشکل خود را برای تیم پشتیبانی ما شرح دهید. هرچه جزئیات
              بیشتر باشد، پاسخ سریع‌تر و دقیق‌تری دریافت می‌کنید.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-10">
        <NewTicketForm orderOptions={orderOptions} initial={initial} />
      </section>
    </SiteShell>
  );
}
