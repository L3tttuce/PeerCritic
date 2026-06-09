"use client";

import { SWRConfig } from "swr";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { api } from "@/app/apiClient";

const fetcher = (url: string) =>
  api.get(url, { headers: { Accept: "application/json" } }).then((res) => res.data);

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 5000 }}>
      <AuthProvider>{children}</AuthProvider>
    </SWRConfig>
  );
}
