"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatToman, formatTomanShort, toFaDigits } from "@/lib/format";
import { TrendingUp, ShoppingBag, BarChart3 } from "lucide-react";

export interface ChartDay {
  date: string;
  label: string;
  orders: number;
  revenue: number;
  completed: number;
}

type Metric = "revenue" | "orders";

interface TooltipPayload {
  date: string;
  label: string;
  orders: number;
  revenue: number;
  completed: number;
}

function CustomTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayload }>;
  metric: Metric;
}) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-soft">
      <div className="mb-1 text-[11px] font-medium text-muted-foreground">
        {d.label}
      </div>
      {metric === "revenue" ? (
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="tnum text-sm font-bold tabular-nums text-foreground">
            {formatToman(d.revenue)}
          </span>
          <span className="text-[10px] text-muted-foreground">تومان</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="tnum text-sm font-bold tabular-nums text-foreground">
            {toFaDigits(d.orders)}
          </span>
          <span className="text-[10px] text-muted-foreground">سفارش</span>
        </div>
      )}
      <div className="mt-1 text-[10px] text-muted-foreground">
        {toFaDigits(d.completed)} تکمیل‌شده
      </div>
    </div>
  );
}

export function AdminCharts({ data }: { data: ChartDay[] }) {
  const [metric, setMetric] = useState<Metric>("revenue");

  const total = data.reduce(
    (s, d) => s + (metric === "revenue" ? d.revenue : d.orders),
    0
  );
  const completed = data.reduce((s, d) => s + d.completed, 0);
  const peak = Math.max(...data.map((d) => (metric === "revenue" ? d.revenue : d.orders)));

  return (
    <Card className="py-0">
      <CardHeader className="flex-row items-start justify-between border-b border-border/60 py-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            نمای کلی ۱۴ روز اخیر
          </CardTitle>
          <CardDescription className="text-xs">
            درآمد و تعداد سفارش‌ها در دو هفته گذشته
          </CardDescription>
        </div>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <TabsList className="h-8 bg-muted/60 p-0.5">
            <TabsTrigger value="revenue" className="h-7 px-3 text-[11px]">
              درآمد
            </TabsTrigger>
            <TabsTrigger value="orders" className="h-7 px-3 text-[11px]">
              سفارش‌ها
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Summary stats */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div>
            <div className="text-[10px] text-muted-foreground">
              {metric === "revenue" ? "مجموع درآمد" : "مجموع سفارش‌ها"}
            </div>
            <div className="tnum mt-0.5 text-lg font-bold tabular-nums text-foreground">
              {metric === "revenue"
                ? `${formatToman(total)} ت`
                : toFaDigits(total)}
            </div>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div>
            <div className="text-[10px] text-muted-foreground">
              سفارش‌های تکمیل‌شده
            </div>
            <div className="tnum mt-0.5 text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {toFaDigits(completed)}
            </div>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div>
            <div className="text-[10px] text-muted-foreground">اوج</div>
            <div className="tnum mt-0.5 text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {metric === "revenue"
                ? `${formatTomanShort(peak)} ت`
                : toFaDigits(peak)}
            </div>
          </div>
        </div>

        {/* Chart */}
        <motion.div
          key={metric}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="h-56 w-full sm:h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            {metric === "revenue" ? (
              <AreaChart
                data={data}
                margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.13 162)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.55 0.13 162)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.92 0.005 120)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.015 160)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.015 160)" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v) =>
                    v >= 1000
                      ? toFaDigits(Math.round(v / 1000)) + "k"
                      : toFaDigits(v)
                  }
                />
                <Tooltip
                  content={<CustomTooltip metric="revenue" />}
                  cursor={{ stroke: "oklch(0.55 0.13 162)", strokeWidth: 1, strokeDasharray: "3 3" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.55 0.13 162)"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "oklch(0.55 0.13 162)" }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.92 0.005 120)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.015 160)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "oklch(0.5 0.015 160)" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  tickFormatter={(v) => toFaDigits(v)}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<CustomTooltip metric="orders" />}
                  cursor={{ fill: "oklch(0.55 0.13 162 / 0.06)" }}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {data.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.orders > 0
                          ? "oklch(0.55 0.13 162)"
                          : "oklch(0.92 0.005 120)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </motion.div>

        {/* Legend / footer */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {metric === "revenue" ? (
              <>
                <TrendingUp className="h-3 w-3 text-primary" />
                درآمد روزانه (تومان)
              </>
            ) : (
              <>
                <ShoppingBag className="h-3 w-3 text-primary" />
                سفارش‌های روزانه
              </>
            )}
          </span>
          <span>۱۴ روز گذشته</span>
        </div>
      </CardContent>
    </Card>
  );
}
