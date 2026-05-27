import { NextRequest, NextResponse } from "next/server";
import type { MonthlyCostEntry } from "@/types/datadog";

function monthsBack(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Datadog v1 usage summary fields → display labels
const USAGE_FIELDS: { key: string; label: string }[] = [
  { key: "apm_hosts_top99p", label: "APM Hosts" },
  { key: "infra_host_top99p", label: "Infrastructure Hosts" },
  { key: "agent_host_top99p", label: "Agent Hosts" },
  { key: "containers_without_agent_top99p", label: "Containers" },
  { key: "custom_ts_avg", label: "Custom Metrics" },
  { key: "logs_indexed_sum", label: "Logs (Indexed)" },
  { key: "ingested_events_bytes_sum", label: "Logs (Ingested)" },
  { key: "rum_session_count_sum", label: "RUM Sessions" },
  { key: "synthetics_api_tests_runs_sum", label: "Synthetics API" },
  { key: "synthetics_browser_checks_run_sum", label: "Synthetics Browser" },
  { key: "profiling_host_top99p", label: "Continuous Profiler" },
  { key: "aws_lambda_func_count", label: "Serverless (Lambda)" },
  { key: "fargate_tasks_count_avg", label: "Fargate Tasks" },
  { key: "npm_host_top99p", label: "Network Monitoring" },
];

type UsageRecord = Record<string, number | string>;

function toEntries(usageList: UsageRecord[]): MonthlyCostEntry[] {
  return usageList.map((u) => {
    const dateRaw = String(u.date ?? "");
    const date = dateRaw.substring(0, 7);

    const charges = USAGE_FIELDS
      .map(({ key, label }) => ({
        product_name: key,
        display_name: label,
        cost: typeof u[key] === "number" ? (u[key] as number) : 0,
        charge_type: "usage",
      }))
      .filter((c) => c.cost > 0);

    const total = charges.reduce((s, c) => s + c.cost, 0);
    return { date, total_cost: total, org_name: "", charges };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = req.headers.get("x-dd-api-key");
  const appKey = req.headers.get("x-dd-app-key");
  const site = searchParams.get("site") ?? "datadoghq.com";

  if (!apiKey || !appKey) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 401 });
  }

  const url = new URL(`https://api.${site}/api/v1/usage/summary`);
  url.searchParams.set("start_month", monthsBack(5));
  url.searchParams.set("end_month", monthsBack(0));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "DD-API-KEY": apiKey,
        "DD-APPLICATION-KEY": appKey,
        "Accept": "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const raw = (body as { errors?: unknown[] })?.errors?.[0];
      const msg = typeof raw === "string" ? raw
        : [(raw as Record<string, string>)?.title, (raw as Record<string, string>)?.detail].filter(Boolean).join(" — ")
          || `Datadog API error ${res.status}`;
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const json = await res.json() as { usage?: UsageRecord[] };
    const entries = toEntries(json.usage ?? []);
    entries.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ data: entries, type: "usage" });
  } catch {
    return NextResponse.json({ error: "Failed to reach Datadog API" }, { status: 502 });
  }
}
