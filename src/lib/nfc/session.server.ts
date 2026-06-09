import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  getStrictClearCookieOptions,
  getStrictCookieOptions,
} from "@/lib/nfc/device-cookies.server";
import {
  NFC_FINGERPRINT_COOKIE,
  NFC_PROFILE_COOKIE,
  NFC_SESSION_COOKIE,
  NFC_SESSION_TTL_DAYS,
} from "@/lib/nfc/constants";
import { logNfcError, logNfcEvent } from "@/lib/nfc/error-logger";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("CRITICAL: Supabase ENV variables are missing!", {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(supabaseServiceKey),
  });
  throw new Error("Supabase environment variables are missing");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type NfcSessionRecord = {
  sessionId: string;
  profileId: string;
  nfcId: string;
  expiresAt: string;
};

function sessionExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + NFC_SESSION_TTL_DAYS);
  return expiresAt;
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

export async function getNfcSession(): Promise<NfcSessionRecord | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(NFC_SESSION_COOKIE)?.value?.trim();

  if (!sessionId) {
    return null;
  }

  const { data, error } = await supabase
    .from("nfc_sessions")
    .select("id, profile_id, nfc_id, expires_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data?.profile_id || !data.nfc_id) {
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

export async function createEphemeralNfcSession(params: {
  profileId: string;
  nfcId: string;
  userAgent?: string;
}): Promise<string> {
  const expiresAt = sessionExpiresAt();

  console.log("[NFC_AUTH_DEBUG]: nfc_sessions.insert deneniyor", {
    profileId: params.profileId,
    nfcId: params.nfcId,
    expiresAt: expiresAt.toISOString(),
  });

  const { data, error } = await supabase
    .from("nfc_sessions")
    .insert({
      profile_id: params.profileId,
      nfc_id: params.nfcId,
      fingerprint: null,
      user_agent: params.userAgent ?? null,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error(
      "[NFC_AUTH_DEBUG]: Hata sebebi nfc_sessions.insert — Supabase insert reddetti",
      error
    );
    console.error("[createEphemeralNfcSession] nfc_sessions.insert başarısız", error);
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
  profileId: string
): Promise<void> {
  const trimmedSessionId = sessionId?.trim() ?? "";
  const trimmedProfileId = profileId?.trim() ?? "";

  if (!trimmedSessionId || !trimmedProfileId) {
    console.error(
      "[NFC_AUTH_DEBUG]: Hata sebebi çerez değerleri boş — oturum yazılamadı",
      {
        sessionId: trimmedSessionId || "(boş)",
        profileId: trimmedProfileId || "(boş)",
      }
    );
    throw new Error("NFC çerez değerleri boş — oturum yazılamadı.");
  }

  try {
    const cookieStore = await cookies();
    const cookieOptions = getStrictCookieOptions(sessionExpiresAt());

    cookieStore.set(NFC_SESSION_COOKIE, trimmedSessionId, cookieOptions);
    cookieStore.set(NFC_PROFILE_COOKIE, trimmedProfileId, cookieOptions);

    console.log("[NFC_AUTH_DEBUG]: NFC oturum çerezleri set edildi", {
      sessionId: trimmedSessionId,
      profileId: trimmedProfileId,
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
 * DB kaydı (profile_id) + astrotag_nfc_session / astrotag_nfc_profile çerezleri.
 */
export async function setNfcSession(params: {
  profileId: string;
  nfcCardUuid: string;
  userAgent?: string;
}): Promise<string> {
  const sessionId = await createEphemeralNfcSession({
    profileId: params.profileId,
    nfcId: params.nfcCardUuid,
    userAgent: params.userAgent,
  });

  try {
    await setNfcSessionCookies(sessionId, params.profileId);
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

  try {
    const { data, error } = await supabase
      .from("nfc_cards")
      .select("id, is_active, profile_id, is_claimed, owner_id")
      .eq("unique_id", normalizedId)
      .maybeSingle();

    if (error) {
      console.error("[validateNfcCardActive] nfc_cards sorgu hatası:", error);
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
  } catch (error) {
    console.error("[validateNfcCardActive] Beklenmeyen hata:", error);
    logNfcError(ctx, error, { uniqueId: normalizedId, step: "nfc_cards.select" });
    return { ok: false, reason: "db_error" };
  }
}

export type NfcCardAuthEntry = NfcCardActive & {
  isActive: boolean;
};

export type NfcCardAuthLookupFailure = {
  ok: false;
  reason: "config_error" | "db_error" | "not_found";
};

/**
 * Kayıt / giriş acil çıkışı — kart pasif olsa da DB kaydı varsa döner.
 */
export async function resolveNfcCardForAuth(
  uniqueId: string
): Promise<({ ok: true } & NfcCardAuthEntry) | NfcCardAuthLookupFailure> {
  const ctx = { layer: "action" as const, handler: "resolveNfcCardForAuth" };
  const normalizedId = normalizeNfcUniqueId(uniqueId);

  if (!normalizedId.startsWith("at_")) {
    return { ok: false, reason: "not_found" };
  }

  console.log("Sorgulanan Kart ID'si:", uniqueId);
  console.log("Veritabanı sorgu ID'si (normalize):", normalizedId);

  try {
    const { data, error } = await supabase
      .from("nfc_cards")
      .select("id, is_active, profile_id, is_claimed, owner_id")
      .eq("unique_id", normalizedId)
      .maybeSingle();

    if (error) {
      console.error("[resolveNfcCardForAuth] nfc_cards sorgu hatası:", error);
      logNfcError(ctx, error, { uniqueId: normalizedId, step: "nfc_cards.select" });
      return { ok: false, reason: "db_error" };
    }

    if (!data) {
      console.error("[resolveNfcCardForAuth] Kart bulunamadı:", {
        uniqueId: normalizedId,
        rawUniqueId: uniqueId,
      });
      logNfcEvent("warn", ctx, "NFC kartı bulunamadı", { uniqueId: normalizedId });
      return { ok: false, reason: "not_found" };
    }

    if (!data.is_active) {
      logNfcEvent("warn", ctx, "NFC kartı pasif — acil auth yolu", {
        uniqueId: normalizedId,
        nfcId: data.id,
      });
    }

    return {
      ok: true,
      nfcId: data.id,
      profileId: data.profile_id ?? null,
      isClaimed: Boolean(data.is_claimed),
      ownerId: data.owner_id ?? null,
      isActive: Boolean(data.is_active),
    };
  } catch (error) {
    console.error("[resolveNfcCardForAuth] Beklenmeyen hata:", error);
    logNfcError(ctx, error, { uniqueId: normalizedId, step: "resolveNfcCardForAuth" });
    return { ok: false, reason: "db_error" };
  }
}
