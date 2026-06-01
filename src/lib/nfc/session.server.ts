import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  NFC_SESSION_COOKIE,
  NFC_SESSION_TTL_DAYS,
} from "@/lib/nfc/constants";

export type NfcSessionRecord = {
  sessionId: string;
  profileId: string;
  keyId: string;
  expiresAt: string;
};

export async function getNfcSession(): Promise<NfcSessionRecord | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(NFC_SESSION_COOKIE)?.value?.trim();

  if (!sessionId) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("nfc_sessions")
    .select("id, profile_id, key_id, expires_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data?.profile_id || !data.key_id) {
    return null;
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await supabase.from("nfc_sessions").delete().eq("id", sessionId);
    return null;
  }

  return {
    sessionId: data.id,
    profileId: data.profile_id,
    keyId: data.key_id,
    expiresAt: data.expires_at,
  };
}

export async function getNfcSessionProfileId(): Promise<string | null> {
  const session = await getNfcSession();
  return session?.profileId ?? null;
}

export async function requireNfcSessionProfileId(): Promise<string> {
  const profileId = await getNfcSessionProfileId();

  if (!profileId) {
    throw new Error("NFC oturumu bulunamadı.");
  }

  return profileId;
}

export async function createNfcSessionRecord(
  profileId: string,
  keyId: string
): Promise<string> {
  const supabase = createSupabaseServiceClient();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + NFC_SESSION_TTL_DAYS);

  const { data, error } = await supabase
    .from("nfc_sessions")
    .insert({
      profile_id: profileId,
      key_id: keyId,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error("NFC oturumu oluşturulamadı.");
  }

  return data.id as string;
}

export async function setNfcSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + NFC_SESSION_TTL_DAYS);

  cookieStore.set(NFC_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearNfcSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(NFC_SESSION_COOKIE)?.value;

  if (sessionId) {
    const supabase = createSupabaseServiceClient();
    await supabase.from("nfc_sessions").delete().eq("id", sessionId);
  }

  cookieStore.set(NFC_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
