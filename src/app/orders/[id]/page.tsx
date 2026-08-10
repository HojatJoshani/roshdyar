import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SiteShell } from "@/components/brand/site-shell";
import { ServiceBreadcrumb } from "@/components/brand/service-breadcrumb";
import { OrderTimeline, type OrderDetailData } from "./order-timeline";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/login?reason=auth&from=${encodeURIComponent(`/orders/${id}`)}`);
  }

  const order = await db.order.findFirst({
    where: {
      AND: [
        { id },
        {
          OR: [{ userId: session.id }, { user: { role: "ADMIN" } }],
        },
      ],
    },
    include: {
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Strip ALL provider-only fields. providerOrderId / providerMeta / walletTxId
  // must never reach the client.
  const data: OrderDetailData = {
    id: order.id,
    code: order.code,
    serviceName: order.serviceName,
    serviceSlug: order.serviceSlug,
    platform: order.platform,
    category: order.category,
    tier: order.tier as "ECONOMY" | "STANDARD" | "PREMIUM",
    tierDisplay: order.tierDisplay,
    emoji: order.emoji,
    quantity: order.quantity,
    unitPricePer1000: order.unitPricePer1000,
    totalAmount: order.totalAmount,
    discountAmount: order.discountAmount,
    promoCode: order.promoCode,
    targetLink: order.targetLink,
    notes: order.notes,
    status: order.status as
      | "PENDING"
      | "PAYMENT_CONFIRMED"
      | "PROCESSING"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "PARTIAL"
      | "FAILED",
    startedCount: order.startedCount,
    remainsCount: order.remainsCount,
    completedCount: order.completedCount,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    // Admin-only: pass provider fields (stripped client-side if not admin)
    providerOrderId: session.role === "ADMIN" ? order.providerOrderId : null,
    providerMeta: session.role === "ADMIN" ? order.providerMeta : null,
    events: order.events.map((e) => ({
      id: e.id,
      status: e.status as
        | "PENDING"
        | "PAYMENT_CONFIRMED"
        | "PROCESSING"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "PARTIAL"
        | "FAILED",
      message: e.message,
      createdAt: e.createdAt.toISOString(),
    })),
  };

  const supportHref = `/support/new?orderId=${order.id}&subject=${encodeURIComponent(
    `پیگیری سفارش ${order.code}`
  )}`;

  const isAdmin = session.role === "ADMIN";

  // Fetch related orders: for admins, other orders from the same user;
  // for customers, other orders for the same service.
  const relatedOrdersRaw = await db.order.findMany({
    where: {
      AND: [
        { id: { not: order.id } },
        isAdmin
          ? { userId: order.userId }
          : { userId: order.userId, serviceSlug: order.serviceSlug },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      code: true,
      serviceName: true,
      emoji: true,
      status: true,
      totalAmount: true,
      createdAt: true,
    },
  });
  const relatedOrders = relatedOrdersRaw.map((o) => ({
    id: o.id,
    code: o.code,
    serviceName: o.serviceName,
    emoji: o.emoji,
    status: o.status as any,
    totalAmount: o.totalAmount,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-mesh-brand">
        <div className="container mx-auto px-4 py-7">
          <ServiceBreadcrumb
            items={[
              { label: "خانه", href: "/" },
              { label: "سفارش‌ها", href: "/orders" },
              { label: order.code },
            ]}
            className="mb-4"
          />
        </div>
      </section>

      <section className="container mx-auto px-4 py-6 md:py-10">
        <OrderTimeline order={data} supportHref={supportHref} isAdmin={isAdmin} relatedOrders={relatedOrders} />
      </section>
    </SiteShell>
  );
}
