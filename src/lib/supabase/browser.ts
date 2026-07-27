"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_AUTH_CLIENT_OPTIONS } from "@/lib/auth/auth-config";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

let browserClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabasePublicEnv();
  browserClient = createBrowserClient(url, anonKey, {
    auth: { ...SUPABASE_AUTH_CLIENT_OPTIONS },
  });
  return browserClient;
}
