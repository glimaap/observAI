"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Credentials } from "@/types/datadog";

interface CredentialsContextValue {
  credentials: Credentials | null;
  setCredentials: (creds: Credentials | null) => void;
  isConfigured: boolean;
}

const CredentialsContext = createContext<CredentialsContextValue | null>(null);

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  return (
    <CredentialsContext.Provider
      value={{
        credentials,
        setCredentials,
        isConfigured: credentials !== null,
      }}
    >
      {children}
    </CredentialsContext.Provider>
  );
}

export function useCredentials() {
  const ctx = useContext(CredentialsContext);
  if (!ctx) throw new Error("useCredentials must be used inside CredentialsProvider");
  return ctx;
}
