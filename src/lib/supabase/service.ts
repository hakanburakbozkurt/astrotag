import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Admin yetkisi — RLS bypass; sunucu action'larında profil yazımı için */
export function createServiceRoleClient(): SupabaseClient {
  return createSupabaseServiceClient();
}

export function createSupabaseServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
