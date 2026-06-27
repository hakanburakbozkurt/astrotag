"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { Toaster } from "@/lib/toast";
import { SWR_DEFAULT_OPTIONS } from "@/lib/auth/data-cache";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={SWR_DEFAULT_OPTIONS}>
      {children}
      <Toaster
        position="top-center"
        gutter={12}
        containerClassName="!top-[max(1rem,env(safe-area-inset-top))]"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(15, 23, 42, 0.95)",
            color: "#f8fafc",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            fontSize: "14px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
          },
          success: {
            iconTheme: {
              primary: "#fbbf24",
              secondary: "#0f172a",
            },
          },
          error: {
            iconTheme: {
              primary: "#f87171",
              secondary: "#0f172a",
            },
          },
        }}
      />
    </SWRConfig>
  );
}
