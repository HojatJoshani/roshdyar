"use client";

import { useQuery } from "@tanstack/react-query";

export function useWalletBalance() {
  const q = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: async () => {
      const r = await fetch("/api/wallet/balance", { cache: "no-store" });
      if (!r.ok) throw new Error("fetch failed");
      const d = await r.json();
      return d.balance as number;
    },
    refetchInterval: 15000,
    staleTime: 5000,
  });
  return { balance: q.data ?? 0, isLoading: q.isLoading, refetch: q.refetch };
}
