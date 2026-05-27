"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductCost } from "@/types/datadog";

const COLORS = [
  "#8b5cf6", "#60a5fa", "#34d399", "#fbbf24", "#f87171",
];

interface Props {
  data: ProductCost[];
  loading: boolean;
}

function formatUSD(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as ProductCost;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="font-medium text-foreground mb-1">{item.display_name}</p>
      <p className="text-violet-300 font-bold tabular-nums">
        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.cost)}
      </p>
      <p className="text-muted-foreground text-xs">{item.percentage.toFixed(1)}% of total</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  return (
    <ul className="flex flex-col gap-1.5 mt-2">
      {payload?.map((entry: { color: string; value: string }, i: number) => (
        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="truncate">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function CostDistributionChart({ data, loading }: Props) {
  // Top 4 + "Others"
  const sorted = [...data].sort((a, b) => b.cost - a.cost);
  const top4 = sorted.slice(0, 4);
  const rest = sorted.slice(4);
  const othersCost = rest.reduce((s, p) => s + p.cost, 0);
  const othersPct = rest.reduce((s, p) => s + p.percentage, 0);

  const chartData: ProductCost[] = [
    ...top4,
    ...(othersCost > 0
      ? [{ product_name: "others", display_name: "Others", cost: othersCost, percentage: othersPct }]
      : []),
  ];

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Cost Distribution</h3>
        <p className="text-xs text-muted-foreground">Current month breakdown</p>
      </div>

      {loading ? (
        <Skeleton className="h-56 w-full rounded-xl bg-white/10" />
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0" style={{ width: 180, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="cost"
                  nameKey="display_name"
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={0.9}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 min-w-0">
            <CustomLegend
              payload={chartData.map((d, i) => ({
                color: COLORS[i % COLORS.length],
                value: `${d.display_name} (${d.percentage.toFixed(1)}%)`,
              }))}
            />
            <div className="mt-3 pt-3 border-t border-white/8">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-bold text-foreground tabular-nums">
                {formatUSD(chartData.reduce((s, d) => s + d.cost, 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
