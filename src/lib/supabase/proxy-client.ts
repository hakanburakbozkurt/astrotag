import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_AUTH_SERVER_OPTIONS } from "@/lib/auth/auth-config";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

/**
 * Proxy/middleware — Supabase oturum çerezlerini okur ve yeniler.
 */
export function createSupabaseProxyClient(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, anonKey, {
    auth: { ...SUPABASE_AUTH_SERVER_OPTIONS },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, getResponse: () => response };
}
