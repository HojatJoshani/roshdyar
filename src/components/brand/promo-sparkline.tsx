"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";

interface RedemptionDay {
  date: string;
  count: number;
}

/**
 * Tiny inline bar chart sparkline showing daily redemptions for a promo code.
 * Used inside the admin promos list as a quick visual usage indicator.
 */
export function PromoSparkline({ data }: { data: RedemptionDay[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    return (
      <div className="flex h-8 items-center text-[10px] text-muted-foreground/60">
        بدون استفاده اخیر
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const p = payload[0].payload as RedemptionDay;
              return (
                <div className="rounded-md border border-border bg-popover px-2 py-1 text-[10px] shadow-soft">
                  <span className="tnum font-medium tabular-nums text-foreground">
                    {p.count.toLocaleString("fa-IR")}
                  </span>{" "}
                  <span className="text-muted-foreground">استفاده در {p.date}</span>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={6}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.count > 0 ? "oklch(0.55 0.13 162)" : "oklch(0.9 0.005 120)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
