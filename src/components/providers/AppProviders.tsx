"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import BadgeAwardedListener from "@/components/badges/BadgeAwardedListener";
import { Toaster } from "@/lib/toast";
import { SWR_DEFAULT_OPTIONS } from "@/lib/auth/data-cache";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={SWR_DEFAULT_OPTIONS}>
      {children}
      <BadgeAwardedListener />
      <Toaster
        position="top-center"
        gutter={12}
        containerClassName="!top-[max(1rem,env(safe-area-inset-top))]"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#18181b",
            color: "#E5E0D8",
            border: "1px solid #27272a",
            borderRadius: "2px",
            fontSize: "14px",
            boxShadow: "none",
          },
          success: {
            iconTheme: {
              primary: "#E5E0D8",
              secondary: "#09090b",
            },
          },
          error: {
            iconTheme: {
              primary: "#a1a1aa",
              secondary: "#09090b",
            },
          },
        }}
      />
    </SWRConfig>
  );
}
