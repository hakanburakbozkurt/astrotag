"use client";

import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export type WaitForSessionOptions = {
  maxAttempts?: number;
  intervalMs?: number;
};

/**
 * E-posta callback / OTP sonrası çerezlerin işlenmesini bekler.
 */
export async function waitForSupabaseSession(
  options?: WaitForSessionOptions
): Promise<Session | null> {
  const maxAttempts = options?.maxAttempts ?? 40;
  const intervalMs = options?.intervalMs ?? 125;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("[waitForSupabaseSession]", error.message);
    }

    if (data.session?.access_token) {
      return data.session;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
}
