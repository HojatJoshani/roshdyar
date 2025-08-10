"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Notification = {
  id: string;
  orderId: string;
  orderCode: string;
  orderEmoji: string;
  serviceName: string;
  status: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export function useNotifications() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) throw new Error("fetch failed");
      const d = await r.json();
      return {
        notifications: d.notifications as Notification[],
        unread: d.unread as number,
      };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications: q.data?.notifications ?? [],
    unread: q.data?.unread ?? 0,
    isLoading: q.isLoading,
    markAllRead: markAllRead.mutate,
    isMarking: markAllRead.isPending,
  };
}
