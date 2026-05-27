"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[observai global-error]", error?.message, error?.stack);
  }, [error]);

  return (
    <html>
      <body style={{ background: "#0a0a1a", color: "#fff", fontFamily: "monospace", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#f87171", marginBottom: "1rem", wordBreak: "break-all", maxWidth: 600 }}>
            {error?.message ?? "Unknown error"}
          </p>
          <button onClick={reset} style={{ padding: "0.5rem 1.5rem", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
