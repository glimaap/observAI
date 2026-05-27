import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey, appKey, site = "datadoghq.com" } = await req.json();

  if (!apiKey || !appKey) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.${site}/api/v1/validate`, {
      headers: {
        "DD-API-KEY": apiKey,
        "DD-APPLICATION-KEY": appKey,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const raw = body?.errors?.[0];
      const msg = typeof raw === "string" ? raw : (raw?.title ?? raw?.detail ?? "Invalid credentials");
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ valid: true, org: data?.name });
  } catch {
    return NextResponse.json({ error: "Failed to reach Datadog API" }, { status: 502 });
  }
}
