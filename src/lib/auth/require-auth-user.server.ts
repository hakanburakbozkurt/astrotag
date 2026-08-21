import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SupabaseActionError } from "@/lib/supabase-action-error";

export async function requireAuthUserUuid(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    throw new SupabaseActionError("Oturum geçersiz. Lütfen tekrar giriş yapın.");
  }

  return user.id;
}
