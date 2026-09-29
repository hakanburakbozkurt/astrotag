import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { SUPABASE_AUTH_SERVER_OPTIONS } from "@/lib/auth/auth-config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization")?.trim();
  if (!header) {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

/**
 * Mobil istemci Bearer JWT ile API route'lara erişir; web tarayıcı cookie kullanır.
 */
export async function createApiRouteSupabaseClient(
  request: NextRequest
): Promise<SupabaseClient> {
  const bearerToken = extractBearerToken(request);

  if (!bearerToken) {
    return createServerSupabaseClient();
  }

  const { url, anonKey } = getSupabasePublicEnv();

  return createClient(url, anonKey, {
    auth: {
      ...SUPABASE_AUTH_SERVER_OPTIONS,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    },
  });
}
