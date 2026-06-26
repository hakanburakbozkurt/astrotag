"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { SWR_DEFAULT_OPTIONS } from "@/lib/auth/data-cache";

export default function AppProviders({ children }: { children: ReactNode }) {
  return <SWRConfig value={SWR_DEFAULT_OPTIONS}>{children}</SWRConfig>;
}
