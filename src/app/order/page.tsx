import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SiteShell } from "@/components/brand/site-shell";
import { ServiceBreadcrumb } from "@/components/brand/service-breadcrumb";
import { OrderFlow, type OrderFlowTierData } from "./order-flow";

export const dynamic = "force-dynamic";

// Reasonable bounds to prevent obvious abuse from query params.
const MAX_QTY = 5_000_000;

interface SearchParams {
  serviceTierId?: string;
  quantity?: string;
  link?: string;
}

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session) {
    const qs = new URLSearchParams(
      sp as Record<string, string>
    ).toString();
    const from = qs ? `/order?${qs}` : "/order";
    redirect(`/login?reason=auth&from=${encodeURIComponent(from)}`);
  }

  const serviceTierId = sp.serviceTierId?.trim() ?? "";
  const quantityRaw = sp.quantity?.trim() ?? "";
  const link = sp.link?.trim() ?? "";

  // Basic presence check — fall back to catalog if any required param missing.
  if (!serviceTierId || !quantityRaw || !link) {
    redirect("/services/instagram");
  }

  const quantity = parseInt(quantityRaw, 10);
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_QTY) {
    redirect("/services/instagram");
  }

  // Load tier + service snapshot.
  const tier = await db.serviceTier.findUnique({
    where: { id: serviceTierId },
    include: { service: true },
  });

  if (!tier || !tier.isActive || !tier.service || !tier.service.isActive) {
    redirect("/services/instagram");
  }

  if (quantity < tier.minQuantity || quantity > tier.maxQuantity) {
    redirect(`/services/${tier.service.slug}`);
  }

  // Total — match the API: Math.round((qty / 1000) * pricePer1000)
  const totalAmount = Math.round((quantity / 1000) * tier.pricePer1000);

  const tierData: OrderFlowTierData = {
    serviceTierId: tier.id,
    serviceName: tier.service.name,
    serviceSlug: tier.service.slug,
    serviceEmoji: tier.service.emoji,
    platform: tier.service.platform,
    category: tier.service.category,
    summary: tier.service.summary,
    tier: tier.tier as "ECONOMY" | "STANDARD" | "PREMIUM",
    tierDisplayName: tier.displayName,
    tierTagline: tier.tagline,
    pricePer1000: tier.pricePer1000,
    minQuantity: tier.minQuantity,
    maxQuantity: tier.maxQuantity,
    step: tier.step,
    deliveryEstimate: tier.deliveryEstimate,
    refillPolicy: tier.refillPolicy,
    refundPolicy: tier.refundPolicy,
    quantity,
    targetLink: link,
    totalAmount,
  };

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-mesh-brand">
        <div className="container mx-auto px-4 py-8">
          <ServiceBreadcrumb
            items={[
              { label: "خانه", href: "/" },
              { label: "خدمات", href: "/services/instagram" },
              {
                label: tier.service.name,
                href: `/services/${tier.service.slug}`,
              },
              { label: "تکمیل سفارش" },
            ]}
            className="mb-4"
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            تکمیل سفارش
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            مراحل نهایی ثبت سفارش را طی کنید. پرداخت امن از کیف پول، با تأیید
            قوانین سرویس انجام می‌شود.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        <OrderFlow tier={tierData} />
      </section>

      <div className="container mx-auto px-4 pb-10">
        <Link
          href={`/services/${tier.service.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          بازگشت به صفحه سرویس
        </Link>
      </div>
    </SiteShell>
  );
}
