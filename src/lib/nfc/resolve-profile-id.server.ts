import "server-only";

import { cookies } from "next/headers";
import {
  NFC_PROFILE_COOKIE,
  NFC_SESSION_COOKIE,
} from "@/lib/nfc/constants";
import { getNfcSession } from "@/lib/nfc/session.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const PROFILE_TABLE = "profiles";

export type ResolvedProfileIdSource =
  | "nfc_sessions"
  | "profile_cookie"
  | "none";

export type ResolvedProfileIdResult = {
  profileId: string;
  source: ResolvedProfileIdSource;
  sessionId: string | null;
};

/**
 * NFC oturumundan profiles.id — önce nfc_sessions (çerez → DB), sonra profile çerezi.
 */
export async function resolveProfileIdFromNfcSession(): Promise<ResolvedProfileIdResult | null> {
  const cookieStore = await cookies();
  const sessionCookieId = cookieStore.get(NFC_SESSION_COOKIE)?.value?.trim() ?? null;
  const profileCookieId = cookieStore.get(NFC_PROFILE_COOKIE)?.value?.trim() ?? null;

  const session = await getNfcSession();
  const sessionProfileId = session?.profileId?.trim() ?? null;

  if (sessionProfileId) {
    return {
      profileId: sessionProfileId,
      source: "nfc_sessions",
      sessionId: session?.sessionId ?? sessionCookieId,
    };
  }

  if (profileCookieId) {
    return {
      profileId: profileCookieId,
      source: "profile_cookie",
      sessionId: sessionCookieId,
    };
  }

  return null;
}

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
