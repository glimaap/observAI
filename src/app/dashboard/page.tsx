"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCredentials } from "@/context/credentials";
import { useCosts } from "@/hooks/useCosts";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { CostTrendChart } from "@/components/dashboard/CostTrendChart";
import { ProductBreakdownChart } from "@/components/dashboard/ProductBreakdownChart";
import { CostDistributionChart } from "@/components/dashboard/CostDistributionChart";
import { CostTable } from "@/components/dashboard/CostTable";
import { Button } from "@/components/ui/button";
import { BarChart3, RefreshCw, LogOut, AlertTriangle, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { credentials, setCredentials, isConfigured } = useCredentials();
  const { summary, loading, error, dataType, refetch } = useCosts();

  // Redirect to setup if no credentials
  useEffect(() => {
    if (!isConfigured) {
      router.replace("/");
    }
  }, [isConfigured, router]);

  function handleDisconnect() {
    setCredentials(null);
    router.replace("/");
  }

  if (!isConfigured) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh relative">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] rounded-full bg-violet-700/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-700/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl glass glow-purple">
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Datadog Cost Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                {credentials?.site ?? "datadoghq.com"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="text-muted-foreground hover:text-red-400 gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Disconnect</span>
            </Button>
          </div>
        </header>

        {/* Usage mode notice */}
        {dataType === "usage" && !error && (
          <div className="flex items-center gap-3 glass border border-blue-500/30 rounded-2xl px-4 py-3 text-sm text-blue-300">
            <span>ℹ</span>
            <p>Showing <strong>usage metrics</strong> (hosts, spans, events) — cost data requires Billing Admin role. Values represent usage counts, not dollars.</p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 glass border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-300">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Failed to load cost data</p>
              <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              className="ml-auto text-red-400 hover:text-red-300 text-xs"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Summary cards */}
        <SummaryCards summary={summary} loading={loading} isUsage={dataType === "usage"} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CostTrendChart
            data={summary?.monthly_trend ?? []}
            loading={loading}
            isUsage={dataType === "usage"}
          />
          <div className="grid grid-cols-1 gap-4">
            <CostDistributionChart
              data={summary?.by_product ?? []}
              loading={loading}
            />
          </div>
        </div>

        {/* Product breakdown bar chart */}
        <ProductBreakdownChart
          data={summary?.by_product ?? []}
          loading={loading}
          isUsage={dataType === "usage"}
        />

        {/* Full table */}
        <CostTable data={summary?.by_product ?? []} loading={loading} isUsage={dataType === "usage"} />

        <footer className="text-center text-xs text-muted-foreground pb-4">
          Data sourced from Datadog&apos;s Estimated Cost API · Refreshed on page load
        </footer>
      </div>
    </div>
  );
}
