import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

const PROFILE_TABLE = "profiles";

/** profiles tablosunda satır var mı — horary_questions FK için zorunlu */
export async function assertProfileIdExists(profileId: string): Promise<string> {
  const trimmed = profileId.trim();
  if (!trimmed) {
    throw new Error("profile_id boş");
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("id")
    .eq("id", trimmed)
    .maybeSingle();

  if (error) {
    throw new Error(`Profil doğrulanamadı: ${error.message}`);
  }

  if (!data?.id?.trim()) {
    throw new Error("Profil veritabanında bulunamadı.");
  }

  return data.id.trim();
}
