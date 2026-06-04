import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  getStrictClearCookieOptions,
  getStrictCookieOptions,
} from "@/lib/nfc/device-cookies.server";
import {
  NFC_FINGERPRINT_COOKIE,
  NFC_PROFILE_COOKIE,
  NFC_SESSION_COOKIE,
  NFC_SESSION_TTL_MINUTES,
} from "@/lib/nfc/constants";
import { isValidFingerprintHash } from "@/lib/nfc/fingerprint.server";
import { logNfcError, logNfcEvent } from "@/lib/nfc/error-logger";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

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

  console.log("[NFC_AUTH_DEBUG]: nfc_sessions.insert deneniyor", {
    profileId: params.profileId,
    nfcId: params.nfcId,
    fingerprintLength: params.fingerprint?.length ?? 0,
    expiresAt: expiresAt.toISOString(),
  });

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

  if (error) {
    console.error(
      "[NFC_AUTH_DEBUG]: Hata sebebi nfc_sessions.insert — Supabase insert reddetti"
    );
    console.error("[NFC_AUTH_DEBUG]: error.message", error.message);
    console.error("[NFC_AUTH_DEBUG]: error.details", error.details);
    console.error("[createEphemeralNfcSession] nfc_sessions.insert başarısız", {
      profileId: params.profileId,
      nfcId: params.nfcId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`NFC oturumu oluşturulamadı: ${error.message}`);
  }

  if (!data?.id) {
    console.error(
      "[NFC_AUTH_DEBUG]: Hata sebebi nfc_sessions.insert — insert başarılı göründü ama session id dönmedi"
    );
    console.error("[createEphemeralNfcSession] insert döndü ama id yok", {
      profileId: params.profileId,
      nfcId: params.nfcId,
      data,
    });
    throw new Error("NFC oturumu oluşturulamadı.");
  }

  return data.id as string;
}

export async function setNfcSessionCookies(
  sessionId: string,
  fingerprint: string,
  profileId: string
): Promise<void> {
  const trimmedSessionId = sessionId?.trim() ?? "";
  const trimmedFingerprint = fingerprint?.trim() ?? "";
  const trimmedProfileId = profileId?.trim() ?? "";

  if (!trimmedSessionId || !trimmedFingerprint || !trimmedProfileId) {
    console.error(
      "[NFC_AUTH_DEBUG]: Hata sebebi çerez değerleri boş — oturum yazılamadı",
      {
        sessionId: trimmedSessionId || "(boş)",
        fingerprint: trimmedFingerprint ? "[set]" : "(boş)",
        profileId: trimmedProfileId || "(boş)",
      }
    );
    throw new Error("NFC çerez değerleri boş — oturum yazılamadı.");
  }

  try {
    const cookieStore = await cookies();
    const cookieOptions = getStrictCookieOptions();

    cookieStore.set(NFC_SESSION_COOKIE, trimmedSessionId, cookieOptions);
    cookieStore.set(NFC_FINGERPRINT_COOKIE, trimmedFingerprint, cookieOptions);
    cookieStore.set(NFC_PROFILE_COOKIE, trimmedProfileId, cookieOptions);

    console.log("[NFC_AUTH_DEBUG]: NFC oturum çerezleri set edildi", {
      sessionId: trimmedSessionId,
      profileId: trimmedProfileId,
      fingerprintLength: trimmedFingerprint.length,
    });
  } catch (error) {
    console.error(
      "[NFC_AUTH_DEBUG]: Hata sebebi cookies().set — Server Action çerez yazımı başarısız",
      error
    );
    throw error instanceof Error
      ? error
      : new Error(
          typeof error === "string" ? error : "NFC çerezleri yazılamadı."
        );
  }
}

/**
 * DB kaydı (profile_id) + astrotag_nfc_session / astrotag_fingerprint / astrotag_nfc_profile çerezleri.
 */
export async function setNfcSession(params: {
  profileId: string;
  nfcCardUuid: string;
  fingerprint: string;
  userAgent?: string;
}): Promise<string> {
  const sessionId = await createEphemeralNfcSession({
    profileId: params.profileId,
    nfcId: params.nfcCardUuid,
    fingerprint: params.fingerprint,
    userAgent: params.userAgent,
  });

  try {
    await setNfcSessionCookies(sessionId, params.fingerprint, params.profileId);
  } catch (error) {
    console.error(
      "[NFC_AUTH_DEBUG]: Hata sebebi setNfcSessionCookies — setNfcSession akışında çerez hatası",
      { sessionId, profileId: params.profileId, error }
    );
    throw error;
  }

  return sessionId;
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
  cookieStore.set(NFC_PROFILE_COOKIE, "", clearOptions);
}

export type NfcCardActive = {
  nfcId: string;
  profileId: string | null;
  isClaimed: boolean;
  ownerId: string | null;
};

export type NfcCardValidationFailure = {
  ok: false;
  reason: "config_error" | "db_error" | "not_found" | "inactive";
};

export async function validateNfcCardActive(
  uniqueId: string
): Promise<
  ({ ok: true } & NfcCardActive) | NfcCardValidationFailure
> {
  const ctx = { layer: "action" as const, handler: "validateNfcCardActive" };
  const normalizedId = normalizeNfcUniqueId(uniqueId);

  let supabase;
  try {
    supabase = createSupabaseServiceClient();
  } catch (error) {
    logNfcError(ctx, error, { uniqueId: normalizedId, step: "service_client" });
    return { ok: false, reason: "config_error" };
  }

  const { data, error } = await supabase
    .from("nfc_cards")
    .select("id, is_active, profile_id, is_claimed, owner_id")
    .eq("unique_id", normalizedId)
    .maybeSingle();

  if (error) {
    logNfcError(ctx, error, { uniqueId: normalizedId, step: "nfc_cards.select" });
    return { ok: false, reason: "db_error" };
  }

  if (!data) {
    logNfcEvent("warn", ctx, "NFC kartı bulunamadı", { uniqueId: normalizedId });
    return { ok: false, reason: "not_found" };
  }

  if (!data.is_active) {
    logNfcEvent("warn", ctx, "NFC kartı pasif", {
      uniqueId: normalizedId,
      nfcId: data.id,
    });
    return { ok: false, reason: "inactive" };
  }

  return {
    ok: true,
    nfcId: data.id,
    profileId: data.profile_id ?? null,
    isClaimed: Boolean(data.is_claimed),
    ownerId: data.owner_id ?? null,
  };
}
