import { SiteShell } from "@/components/brand/site-shell";
import { NotificationsList } from "./notifications-list";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Bell, CheckCheck } from "lucide-react";

export const dynamic = "force-dynamic";

async function getNotifications(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lastSeenNotificationsAt: true },
  });
  const since = user?.lastSeenNotificationsAt ?? new Date(0);

  const events = await db.orderEvent.findMany({
    where: { order: { userId } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: {
        select: {
          id: true,
          code: true,
          emoji: true,
          serviceName: true,
          status: true,
        },
      },
    },
  });

  return events.map((e) => ({
    id: e.id,
    orderId: e.order.id,
    orderCode: e.order.code,
    orderEmoji: e.order.emoji,
    serviceName: e.order.serviceName,
    status: e.status,
    message: e.message,
    createdAt: e.createdAt.toISOString(),
    read: e.createdAt <= since,
  }));
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getNotifications(user.id);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <SiteShell>
      <section className="border-b border-border/60 bg-mesh-brand">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                اعلان‌ها
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                آخرین تغییرات وضعیت سفارش‌های شما در یک نگاه.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        <NotificationsList initialNotifications={notifications} initialUnread={unread} />
      </section>
    </SiteShell>
  );
}
