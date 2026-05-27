"use client";

import { useEffect, useState, useCallback } from "react";
import type { CostSummary, MonthlyCostEntry, ProductCost } from "@/types/datadog";
import { useCredentials } from "@/context/credentials";

function buildSummary(entries: MonthlyCostEntry[]): CostSummary {
  if (!entries.length) {
    return {
      current_month: "",
      total_cost: 0,
      prev_month_cost: 0,
      change_mom_pct: 0,
      top_product: { product_name: "", display_name: "—", cost: 0, percentage: 0 },
      by_product: [],
      monthly_trend: [],
    };
  }

  const latest = entries[entries.length - 1];
  const prev = entries.length >= 2 ? entries[entries.length - 2] : null;

  const totalCost = latest.total_cost;
  const prevCost = prev?.total_cost ?? 0;
  const changePct = prevCost > 0 ? ((totalCost - prevCost) / prevCost) * 100 : 0;

  const productMap = new Map<string, { name: string; display_name: string; cost: number }>();
  for (const charge of latest.charges) {
    const key = charge.product_name;
    const existing = productMap.get(key);
    if (existing) {
      existing.cost += charge.cost;
    } else {
      productMap.set(key, {
        name: key,
        display_name: (charge as { product_name: string; display_name?: string }).display_name ?? charge.product_name,
        cost: charge.cost,
      });
    }
  }

  const byProduct: ProductCost[] = Array.from(productMap.values())
    .filter((p) => p.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .map((p) => ({
      product_name: p.name,
      display_name: p.display_name,
      cost: p.cost,
      percentage: totalCost > 0 ? (p.cost / totalCost) * 100 : 0,
    }));

  const topProduct = byProduct[0] ?? {
    product_name: "",
    display_name: "—",
    cost: 0,
    percentage: 0,
  };

  return {
    current_month: latest.date,
    total_cost: totalCost,
    prev_month_cost: prevCost,
    change_mom_pct: changePct,
    top_product: topProduct,
    by_product: byProduct,
    monthly_trend: entries.map((e) => ({ month: e.date, cost: e.total_cost })),
  };
}

async function apiFetch(
  url: string,
  apiKey: string,
  appKey: string,
): Promise<Response> {
  return fetch(url, {
    headers: { "x-dd-api-key": apiKey, "x-dd-app-key": appKey },
  });
}

export function useCosts() {
  const { credentials } = useCredentials();
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataType, setDataType] = useState<"cost" | "usage" | null>(null);

  const fetch_ = useCallback(async () => {
    if (!credentials) return;
    setLoading(true);
    setError(null);
    const site = encodeURIComponent(credentials.site ?? "datadoghq.com");
    try {
      // Try cost API first
      const costRes = await apiFetch(
        `/api/datadog/costs?site=${site}`,
        credentials.apiKey,
        credentials.appKey,
      );
      const costData = await costRes.json();

      if (costRes.ok) {
        setDataType("cost");
        setSummary(buildSummary(costData.data as MonthlyCostEntry[]));
        return;
      }

      // Cost forbidden — fall back to usage summary
      if (costRes.status === 403) {
        const usageRes = await apiFetch(
          `/api/datadog/usage?site=${site}`,
          credentials.apiKey,
          credentials.appKey,
        );
        const usageData = await usageRes.json();

        if (usageRes.ok) {
          setDataType("usage");
          setSummary(buildSummary(usageData.data as MonthlyCostEntry[]));
          return;
        }

        setError(usageData.error ?? "Failed to fetch usage data");
        return;
      }

      setError(costData.error ?? "Failed to fetch cost data");
    } catch {
      setError("Network error — could not fetch data.");
    } finally {
      setLoading(false);
    }
  }, [credentials]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { summary, loading, error, dataType, refetch: fetch_ };
}
