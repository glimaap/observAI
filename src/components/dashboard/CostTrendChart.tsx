"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface DataPoint {
  month: string;
  cost: number;
}

interface Props {
  data: DataPoint[];
  loading: boolean;
  isUsage?: boolean;
}

function formatMonth(m: string) {
  if (!m) return "";
  const [year, month] = m.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  });
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
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-muted-foreground mb-1">{formatMonth(label)}</p>
      <p className="font-bold text-violet-300 tabular-nums">
        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(payload[0].value)}
      </p>
    </div>
  );
}

export function CostTrendChart({ data, loading, isUsage }: Props) {
  const avgCost = data.length ? data.reduce((s, d) => s + d.cost, 0) / data.length : 0;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Cost Trend</h3>
          <p className="text-xs text-muted-foreground">{isUsage ? "Usage trend — last 6 months" : "Last 6 months"}</p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-56 w-full rounded-xl bg-white/10" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tickFormatter={isUsage ? formatUsage : formatUSD}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            {avgCost > 0 && (
              <ReferenceLine
                y={avgCost}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="4 4"
                label={{ value: "avg", position: "insideTopRight", fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="cost"
              stroke="url(#lineGrad)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#a78bfa", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
