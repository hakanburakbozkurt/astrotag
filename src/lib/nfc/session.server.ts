import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  getStrictClearCookieOptions,
  getStrictCookieOptions,
} from "@/lib/nfc/device-cookies.server";
import {
  NFC_FINGERPRINT_COOKIE,
  NFC_SESSION_COOKIE,
  NFC_SESSION_TTL_MINUTES,
} from "@/lib/nfc/constants";
import { isValidFingerprintHash } from "@/lib/nfc/fingerprint.server";

export type NfcSessionRecord = {
  sessionId: string;
  profileId: string;
  nfcId: string;
  fingerprint: string;
  expiresAt: string;
};

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

export async function getNfcSession(): Promise<NfcSessionRecord | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(NFC_SESSION_COOKIE)?.value?.trim();
  const fingerprint = cookieStore.get(NFC_FINGERPRINT_COOKIE)?.value?.trim();

  if (!sessionId || !isValidFingerprintHash(fingerprint)) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("nfc_sessions")
    .select("id, profile_id, nfc_id, fingerprint, expires_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data?.profile_id || !data.nfc_id || !data.fingerprint) {
    return null;
  }

  if (data.fingerprint !== fingerprint) {
    return null;
  }

  if (isExpired(data.expires_at)) {
    await supabase.from("nfc_sessions").delete().eq("id", sessionId);
    return null;
  }

  return {
    sessionId: data.id,
    profileId: data.profile_id,
    nfcId: data.nfc_id,
    fingerprint: data.fingerprint,
    expiresAt: data.expires_at,
  };
}

export async function getNfcSessionProfileId(): Promise<string | null> {
  const { getProtectedNfcAccess } = await import(
    "@/lib/nfc/protected-access.server"
  );
  const access = await getProtectedNfcAccess();
  return access?.profileId ?? null;
}

export async function requireNfcSessionProfileId(): Promise<string> {
  const { requireProtectedNfcAccess } = await import(
    "@/lib/nfc/protected-access.server"
  );
  const access = await requireProtectedNfcAccess();
  return access.profileId;
}

export async function assertNfcFingerprintMatch(
  nfcId: string,
  fingerprint: string
): Promise<{ ok: true } | { ok: false; reason: "mismatch" | "blocked" }> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("nfc_sessions")
    .select("fingerprint")
    .eq("nfc_id", nfcId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: "blocked" };
  }

  if (!data?.fingerprint) {
    return { ok: true };
  }

  if (data.fingerprint !== fingerprint) {
    return { ok: false, reason: "mismatch" };
  }

  return { ok: true };
}

export async function createEphemeralNfcSession(params: {
  profileId: string;
  nfcId: string;
  fingerprint: string;
  userAgent?: string;
}): Promise<string> {
  const supabase = createSupabaseServiceClient();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + NFC_SESSION_TTL_MINUTES);

  const { data, error } = await supabase
    .from("nfc_sessions")
    .insert({
      profile_id: params.profileId,
      nfc_id: params.nfcId,
      fingerprint: params.fingerprint,
      user_agent: params.userAgent ?? null,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error("NFC oturumu oluşturulamadı.");
  }

  return data.id as string;
}

export async function setNfcSessionCookies(
  sessionId: string,
  fingerprint: string
): Promise<void> {
  const cookieStore = await cookies();
  const cookieOptions = getStrictCookieOptions();

  cookieStore.set(NFC_SESSION_COOKIE, sessionId, cookieOptions);
  cookieStore.set(NFC_FINGERPRINT_COOKIE, fingerprint, cookieOptions);
}

export async function clearNfcSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(NFC_SESSION_COOKIE)?.value;

  if (sessionId) {
    const supabase = createSupabaseServiceClient();
    await supabase.from("nfc_sessions").delete().eq("id", sessionId);
  }

  const clearOptions = getStrictClearCookieOptions();

  cookieStore.set(NFC_SESSION_COOKIE, "", clearOptions);
  cookieStore.set(NFC_FINGERPRINT_COOKIE, "", clearOptions);
}

export type NfcCardActive = {
  nfcId: string;
  profileId: string | null;
  isClaimed: boolean;
  ownerId: string | null;
};

export async function validateNfcCardActive(
  uniqueId: string
): Promise<{ ok: true } & NfcCardActive | { ok: false }> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("nfc_cards")
    .select("id, is_active, profile_id, is_claimed, owner_id")
    .eq("unique_id", uniqueId.trim())
    .maybeSingle();

  if (error || !data?.is_active) {
    return { ok: false };
  }

  return {
    ok: true,
    nfcId: data.id,
    profileId: data.profile_id ?? null,
    isClaimed: Boolean(data.is_claimed),
    ownerId: data.owner_id ?? null,
  };
}
