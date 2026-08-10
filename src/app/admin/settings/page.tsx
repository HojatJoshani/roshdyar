import { requireAdmin } from "@/lib/session";
import { getAllSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { AdminShell } from "../admin-shell";
import { SettingsManager } from "./settings-manager";
import { AuditLogList } from "./audit-log-list";

export const dynamic = "force-dynamic";

async function getAuditLogs() {
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    adminEmail: l.adminEmail,
    targetUserEmail: l.targetUserEmail,
    targetUserName: (() => {
      try {
        return JSON.parse(l.metadata ?? "{}").targetName ?? null;
      } catch {
        return null;
      }
    })(),
    createdAt: l.createdAt.toISOString(),
  }));
}

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [settings, auditLogs] = await Promise.all([
    getAllSettings(),
    getAuditLogs(),
  ]);
  return (
    <AdminShell>
      <SettingsManager initialSettings={settings} />
      <div className="mt-8">
        <AuditLogList logs={auditLogs} />
      </div>
    </AdminShell>
  );
}
