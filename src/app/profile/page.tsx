import { redirect } from "next/navigation";
import { SiteShell } from "@/components/brand/site-shell";
import { ServiceBreadcrumb } from "@/components/brand/service-breadcrumb";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ProfileView } from "./profile-view";
import { formatDateTime, formatToman, toFaDigits } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getProfileData(userId: string) {
  const [user, wallet, orderStats, recentOrders] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),
    db.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    }),
    db.order.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.order.findMany({
      where: { userId },
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
    }),
  ]);

  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
    stats: {
      walletBalance: wallet?.balance ?? 0,
      totalOrders: orderStats._count,
      totalSpent: orderStats._sum.totalAmount ?? 0,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      code: o.code,
      serviceName: o.serviceName,
      emoji: o.emoji,
      status: o.status,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt.toISOString(),
    })),
  };
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect(`/login?reason=auth&from=${encodeURIComponent("/profile")}`);
  }

  const data = await getProfileData(session.id);
  if (!data) {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-sm text-muted-foreground">کاربر یافت نشد.</p>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-mesh-brand">
        <div className="container mx-auto px-4 py-10">
          <ServiceBreadcrumb
            items={[{ label: "خانه", href: "/" }, { label: "حساب من" }]}
            className="mb-4"
          />
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-soft">
              {(data.user.name ?? data.user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {data.user.name ?? "کاربر"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.user.email}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                عضو از {formatDateTime(data.user.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        <ProfileView
          user={data.user}
          stats={data.stats}
          recentOrders={data.recentOrders}
        />
      </section>
    </SiteShell>
  );
}
