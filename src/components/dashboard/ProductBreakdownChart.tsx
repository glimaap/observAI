"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductCost } from "@/types/datadog";

const COLORS = [
  "#8b5cf6", "#60a5fa", "#34d399", "#fbbf24", "#f87171",
  "#a78bfa", "#38bdf8", "#4ade80", "#fb923c", "#f472b6",
];

interface Props {
  data: ProductCost[];
  loading: boolean;
  isUsage?: boolean;
}

function formatUSD(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatUsage(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item: ProductCost = payload[0].payload;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 text-sm shadow-xl max-w-[220px]">
      <p className="font-medium text-foreground mb-1">{item.display_name}</p>
      <p className="text-violet-300 font-bold tabular-nums">
        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.cost)}
      </p>
      <p className="text-muted-foreground text-xs">{item.percentage.toFixed(1)}% of total</p>
    </div>
  );
}

export function ProductBreakdownChart({ data, loading, isUsage }: Props) {
  const top = data.slice(0, 10);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Cost by Product</h3>
        <p className="text-xs text-muted-foreground">{isUsage ? "Current month, top 10 products by usage" : "Current month, top 10 products"}</p>
      </div>

      {loading ? (
        <Skeleton className="h-56 w-full rounded-xl bg-white/10" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={top} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={isUsage ? formatUsage : formatUSD}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="display_name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {top.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
