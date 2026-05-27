"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCredentials } from "@/context/credentials";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
  const router = useRouter();
  const { setCredentials } = useCredentials();

  const [apiKey, setApiKey] = useState("");
  const [appKey, setAppKey] = useState("");
  const [site, setSite] = useState("datadoghq.com");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAppKey, setShowAppKey] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim() || !appKey.trim()) {
      toast.error("Both API Key and Application Key are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/datadog/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, appKey, site }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Validation failed. Check your credentials.");
        return;
      }

      setCredentials({ apiKey, appKey, site });
      toast.success(`Connected${data.org ? ` to ${data.org}` : ""}!`);
      router.push("/dashboard");
    } catch {
      toast.error("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-900/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-strong glow-purple mb-4">
            <BarChart3 className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Datadog Cost Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect your Datadog account to visualize costs and insights
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleConnect}
          className="glass-strong rounded-2xl p-8 space-y-5 glow-purple"
        >
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/90">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Datadog API Key"
                autoComplete="off"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                aria-label="Toggle API Key visibility"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Found in Organization Settings → API Keys
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/90">
              Application Key
            </label>
            <div className="relative">
              <input
                type={showAppKey ? "text" : "password"}
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
                placeholder="Enter your Application Key"
                autoComplete="off"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition"
              />
              <button
                type="button"
                onClick={() => setShowAppKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                aria-label="Toggle App Key visibility"
              >
                {showAppKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Found in Organization Settings → Application Keys
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/90">
              Datadog Site
            </label>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition appearance-none cursor-pointer"
            >
              <option value="datadoghq.com" className="bg-[#0d0d1a]">US1 — datadoghq.com</option>
              <option value="us3.datadoghq.com" className="bg-[#0d0d1a]">US3 — us3.datadoghq.com</option>
              <option value="us5.datadoghq.com" className="bg-[#0d0d1a]">US5 — us5.datadoghq.com</option>
              <option value="datadoghq.eu" className="bg-[#0d0d1a]">EU1 — datadoghq.eu</option>
              <option value="ap1.datadoghq.com" className="bg-[#0d0d1a]">AP1 — ap1.datadoghq.com</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Connect Account
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Keys are stored in memory only and never sent to any server except Datadog&apos;s API.
          </p>
        </form>
      </div>
    </div>
  );
}
