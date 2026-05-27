import { NextRequest, NextResponse } from "next/server";
import type { MonthlyCostEntry, CostCharge } from "@/types/datadog";

function monthsBack(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const PRODUCT_LABELS: Record<string, string> = {
  apm_hosts: "APM Hosts",
  apm_fargate_count: "APM Fargate",
  infra_hosts: "Infrastructure",
  containers: "Containers",
  custom_metrics: "Custom Metrics",
  logs_indexed_events: "Logs (Indexed)",
  logs_ingested_events: "Logs (Ingested)",
  rum_total_sessions: "RUM Sessions",
  synthetics_api: "Synthetics API",
  synthetics_browser: "Synthetics Browser",
  serverless_aws_lambda_functions: "Serverless (Lambda)",
  database_monitoring_hosts: "Database Monitoring",
  network_flows: "Network Monitoring",
  security_signals: "Cloud SIEM",
  profiling_hosts: "Continuous Profiler",
  incident_management: "Incident Management",
  ci_visibility: "CI Visibility",
  sds_scanned_bytes: "Sensitive Data Scanner",
};

function parseEntries(raw: unknown): MonthlyCostEntry[] {
  const data = (raw as { data?: unknown[] })?.data ?? [];
  return (data as Array<{
    attributes: {
      date: string;
      total_cost: number;
      org_name: string;
      charges: CostCharge[];
    };
  }>).map((item) => ({
    date: item.attributes.date?.substring(0, 7) ?? "",
    total_cost: item.attributes.total_cost ?? 0,
    org_name: item.attributes.org_name ?? "",
    charges: (item.attributes.charges ?? []).map((c: CostCharge) => ({
      charge_type: c.charge_type,
      cost: c.cost ?? 0,
      product_name: c.product_name ?? "",
      display_name: PRODUCT_LABELS[c.product_name] ?? c.product_name.replace(/_/g, " "),
    })),
  }));
}

async function fetchCosts(
  site: string,
  apiKey: string,
  appKey: string,
  startMonth: string,
  endMonth: string,
): Promise<{ ok: true; entries: MonthlyCostEntry[] } | { ok: false; status: number; msg: string }> {
  const url = new URL(`https://api.${site}/api/v2/usage/estimated_cost`);
  url.searchParams.set("start_month", startMonth);
  url.searchParams.set("end_month", endMonth);

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
    const detail = typeof raw === "string" ? raw : [(raw as Record<string, string>)?.title, (raw as Record<string, string>)?.detail].filter(Boolean).join(" — ");
    return { ok: false, status: res.status, msg: detail || `Datadog API error ${res.status}` };
  }

  const raw = await res.json();
  const entries = parseEntries(raw);
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return { ok: true, entries };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = req.headers.get("x-dd-api-key");
  const appKey = req.headers.get("x-dd-app-key");
  const site = searchParams.get("site") ?? "datadoghq.com";

  if (!apiKey || !appKey) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 401 });
  }

  try {
    // Try last 6 months first
    const full = await fetchCosts(site, apiKey, appKey, monthsBack(5), monthsBack(0));
    if (full.ok) {
      return NextResponse.json({ data: full.entries });
    }

    // If historical access is denied, fall back to current month only
    if (full.status === 403) {
      const current = await fetchCosts(site, apiKey, appKey, monthsBack(0), monthsBack(0));
      if (current.ok) {
        return NextResponse.json({ data: current.entries, limited: true });
      }
      return NextResponse.json({ error: current.msg }, { status: current.status });
    }

    return NextResponse.json({ error: full.msg }, { status: full.status });
  } catch {
    return NextResponse.json({ error: "Failed to reach Datadog API" }, { status: 502 });
  }
}
