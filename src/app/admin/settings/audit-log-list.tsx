"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, UserCog, ArrowLeftRight } from "lucide-react";
import { formatDateTime, formatRelativeTime, toFaDigits } from "@/lib/format";

interface AuditLog {
  id: string;
  action: string;
  adminEmail: string;
  targetUserEmail: string | null;
  targetUserName: string | null;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; icon: any; tone: string }> = {
  IMPERSONATE_START: {
    label: "شروع جعل هویت",
    icon: UserCog,
    tone: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  },
  IMPERSONATE_END: {
    label: "پایان جعل هویت",
    icon: ArrowLeftRight,
    tone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  },
};

export function AuditLogList({ logs }: { logs: AuditLog[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-foreground">
          <ScrollText className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            گزارش عملیات مدیریت
          </h2>
          <p className="text-xs text-muted-foreground">
            {toFaDigits(logs.length)} رویداد اخیر
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          هنوز رویدادی ثبت نشده است.
        </p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const meta = ACTION_META[log.action] ?? {
              label: log.action,
              icon: ScrollText,
              tone: "bg-muted text-muted-foreground",
            };
            const Icon = meta.icon;
            return (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {meta.label}
                    </span>
                    {log.targetUserEmail && (
                      <span className="text-[11px] text-muted-foreground">
                        → {log.targetUserName ?? log.targetUserEmail}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    توسط {log.adminEmail} • {formatRelativeTime(log.createdAt)}
                    <span title={formatDateTime(log.createdAt)}>
                      {" "}
                      — {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
