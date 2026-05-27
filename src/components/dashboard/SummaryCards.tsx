"use client";

import { DollarSign, TrendingUp, TrendingDown, Package, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CostSummary } from "@/types/datadog";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtMonth(m: string) {
  if (!m) return "—";
  const [year, month] = m.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

interface Props {
  summary: CostSummary | null;
  loading: boolean;
  isUsage?: boolean;
}

function fmtUsage(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

export function SummaryCards({ summary, loading, isUsage }: Props) {
  const momUp = (summary?.change_mom_pct ?? 0) >= 0;
  const fmtVal = isUsage ? fmtUsage : fmt;

  const cards = [
    {
      label: "Current Month",
      icon: Calendar,
      value: loading ? null : fmtMonth(summary?.current_month ?? ""),
      sub: null,
      iconColor: "text-violet-400",
      accent: "from-violet-600/20",
    },
    {
      label: isUsage ? "Total Usage" : "Total Cost",
      icon: DollarSign,
      value: loading ? null : fmtVal(summary?.total_cost ?? 0),
      sub: `vs ${fmtVal(summary?.prev_month_cost ?? 0)} last month`,
      iconColor: "text-blue-400",
      accent: "from-blue-600/20",
    },
    {
      label: "Month-over-Month",
      icon: momUp ? TrendingUp : TrendingDown,
      value: loading ? null : `${momUp ? "+" : ""}${(summary?.change_mom_pct ?? 0).toFixed(1)}%`,
      sub: momUp ? "Increase from last month" : "Decrease from last month",
      iconColor: momUp ? "text-red-400" : "text-emerald-400",
      accent: momUp ? "from-red-600/20" : "from-emerald-600/20",
      valueColor: momUp ? "text-red-400" : "text-emerald-400",
    },
    {
      label: "Top Product",
      icon: Package,
      value: loading ? null : summary?.top_product?.display_name ?? "—",
      sub: loading ? null : `${fmtVal(summary?.top_product?.cost ?? 0)} (${(summary?.top_product?.percentage ?? 0).toFixed(1)}%)`,
      iconColor: "text-amber-400",
      accent: "from-amber-600/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass rounded-2xl p-5 relative overflow-hidden"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} to-transparent pointer-events-none`} />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.label}
              </p>
              <div className={`p-1.5 rounded-lg bg-white/5 ${card.iconColor}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-7 w-32 mb-1.5 bg-white/10" />
            ) : (
              <p className={`text-2xl font-bold tabular-nums ${card.valueColor ?? "text-foreground"}`}>
                {card.value}
              </p>
            )}
            {card.sub && (
              loading ? (
                <Skeleton className="h-3 w-24 mt-1.5 bg-white/10" />
              ) : (
                <p className="text-xs text-muted-foreground mt-1 truncate">{card.sub}</p>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
