import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_AUTH_SERVER_OPTIONS } from "@/lib/auth/auth-config";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

export async function createServerSupabaseClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    auth: { ...SUPABASE_AUTH_SERVER_OPTIONS },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component cookie yazımı bazı bağlamlarda sessizce geçilir.
        }
      },
    },
  });
}
