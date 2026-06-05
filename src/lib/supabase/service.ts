import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Admin yetkisi — RLS bypass; profiles INSERT ve sunucu yazımları */
export function createServiceRoleClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role yapılandırması eksik.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** @deprecated createServiceRoleClient kullan */
export function createSupabaseServiceClient(): SupabaseClient {
  return createServiceRoleClient();
}

/** Terminalde service role env doğrulama (anahtar maskeli) */
export function logSupabaseServiceRoleEnvCheck(context: string): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  console.log(
    `NFC_AUTH: Service role env [${context}]`,
    JSON.stringify(
      {
        hasUrl: Boolean(url),
        hasServiceRoleKey: Boolean(key),
        keySuffix: key ? `…${key.slice(-4)}` : null,
      },
      null,
      2
    )
  );
}
