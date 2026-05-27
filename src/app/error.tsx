"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[observai error boundary]", error?.message, error?.stack);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-sm font-mono text-red-400 bg-red-500/10 rounded-xl px-4 py-3 max-w-xl break-all">
        {error?.message ?? "Unknown error"}
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Back to setup
        </Button>
      </div>
    </div>
  );
}
