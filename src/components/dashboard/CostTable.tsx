"use client";

import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { ProductCost } from "@/types/datadog";

type SortKey = "display_name" | "cost" | "percentage";
type SortDir = "asc" | "desc";

interface Props {
  data: ProductCost[];
  loading: boolean;
  isUsage?: boolean;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function fmtUsage(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function CostTable({ data, loading, isUsage }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("cost");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 ml-1 text-violet-400" />
      : <ArrowDown className="w-3 h-3 ml-1 text-violet-400" />;
  }

  const thClass =
    "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8">
        <h3 className="font-semibold text-foreground">{isUsage ? "Product Usage Breakdown" : "Product Cost Breakdown"}</h3>
        <p className="text-xs text-muted-foreground">All products for the current month</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className={thClass} onClick={() => toggleSort("display_name")}>
                <span className="flex items-center">Product <SortIcon k="display_name" /></span>
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort("cost")}>
                <span className="flex items-center justify-end">Cost <SortIcon k="cost" /></span>
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort("percentage")}>
                <span className="flex items-center justify-end">Share <SortIcon k="percentage" /></span>
              </th>
              <th className={`${thClass} text-right hidden sm:table-cell`}>
                Distribution
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32 bg-white/10" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-20 bg-white/10 ml-auto" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-12 bg-white/10 ml-auto" /></td>
                  <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-2 w-full bg-white/10" /></td>
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No cost data available for the current month.
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={row.product_name}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">{row.display_name}</span>
                      {i === 0 && (
                        <Badge className="text-[10px] py-0 px-1.5 bg-violet-600/30 text-violet-300 border-violet-500/30">
                          Top
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{row.product_name}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground tabular-nums">
                    {isUsage ? fmtUsage(row.cost) : fmt(row.cost)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                    {row.percentage.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                          style={{ width: `${Math.min(row.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
