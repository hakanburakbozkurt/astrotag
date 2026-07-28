import { NextRequest, NextResponse } from "next/server";
import { AUTH_SIGNUP_PATH } from "@/lib/nfc/constants";
import { clearAllAuthState } from "@/lib/nfc/clear-all-auth-cookies.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Misafir süresi doldu — oturumu kapat ve kayıt sayfasına yönlendir */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  await clearAllAuthState();

  return NextResponse.redirect(
    new URL(`${AUTH_SIGNUP_PATH}?msg=guest_expired`, request.url)
  );
}
