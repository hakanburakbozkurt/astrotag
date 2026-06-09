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
import {
  NFC_CARD_AUTH_SELECT,
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
  nfcCardQueryMeta,
} from "@/lib/nfc/nfc-card-table";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** nfc_sessions insert — beklenen sütunlar (migration 262490 / 262300) */
const NFC_SESSIONS_SCHEMA_HINT = {
  id: "uuid — gönderilmez, default gen_random_uuid()",
  profile_id: "uuid NOT NULL — FK profiles(id)",
  nfc_id: "uuid — FK nfc_user_data(id); eski şemada nfc_cards(id)",
  expires_at: "timestamptz NOT NULL — ISO 8601",
  fingerprint: "text nullable — null gönderilebilir",
  user_agent: "text nullable",
  created_at: "timestamptz — gönderilmez, default now()",
} as const;

type NfcSessionInsertPayload = {
  profile_id: string;
  nfc_id: string;
  fingerprint: null;
  user_agent: string | null;
  expires_at: string;
};

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function validateNfcSessionInsertPayload(payload: NfcSessionInsertPayload): string[] {
  const issues: string[] = [];

  if (!payload.profile_id?.trim()) {
    issues.push("profile_id boş");
  } else if (!isUuid(payload.profile_id)) {
    issues.push(`profile_id geçersiz UUID formatı: "${payload.profile_id}"`);
  }

  if (!payload.nfc_id?.trim()) {
    issues.push("nfc_id boş");
  } else if (!isUuid(payload.nfc_id)) {
    issues.push(`nfc_id geçersiz UUID formatı: "${payload.nfc_id}"`);
  }

  if (!payload.expires_at?.trim()) {
    issues.push("expires_at boş");
  } else if (Number.isNaN(Date.parse(payload.expires_at))) {
    issues.push(`expires_at geçersiz tarih: "${payload.expires_at}"`);
  }

  return issues;
}

function formatSupabaseError(error: {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}) {
  return {
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  };
}

async function logNfcSessionInsertFailure(
  payload: NfcSessionInsertPayload,
  validationIssues: string[],
  error: { code?: string; message?: string; details?: string | null; hint?: string | null }
): Promise<void> {
  const [profileLookup, cardLookup] = await Promise.all([
    supabase.from("profiles").select("id").eq("id", payload.profile_id).maybeSingle(),
    supabase
      .from(NFC_CARD_TABLE)
      .select("id, nfc_id, is_active")
      .eq("id", payload.nfc_id)
      .maybeSingle(),
  ]);

  const likelyCause =
    validationIssues.length > 0
      ? "payload_validation_failed"
      : error.code === "23503"
        ? cardLookup.data && !profileLookup.data
          ? "foreign_key_profile_id_missing_in_profiles"
          : cardLookup.data
            ? "foreign_key_nfc_id_wrong_target_table_likely_nfc_cards_not_nfc_user_data"
            : "foreign_key_nfc_id_not_found_in_nfc_user_data"
        : error.code === "42501"
          ? "permission_denied_rls_or_grants"
          : error.code === "23502"
            ? "not_null_violation"
            : "unknown";

  console.error(
    "[createEphemeralNfcSession] nfc_sessions.insert başarısız — tam debug",
    JSON.stringify(
      {
        handler: "createEphemeralNfcSession",
        table: "nfc_sessions",
        payload,
        payloadValidation: {
          ok: validationIssues.length === 0,
          issues: validationIssues,
        },
        supabaseError: formatSupabaseError(error),
        fkDiagnostics: {
          profileExists: Boolean(profileLookup.data?.id),
          profileLookupError: profileLookup.error
            ? formatSupabaseError(profileLookup.error)
            : null,
          nfcCardExistsInNfcUserData: Boolean(cardLookup.data?.id),
          nfcCardSlug: cardLookup.data?.nfc_id ?? null,
          nfcCardActive: cardLookup.data?.is_active ?? null,
          nfcCardLookupError: cardLookup.error
            ? formatSupabaseError(cardLookup.error)
            : null,
        },
        likelyCause,
        schemaHint: NFC_SESSIONS_SCHEMA_HINT,
      },
      null,
      2
    )
  );
}

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
  const profileId = params.profileId?.trim() ?? "";
  const nfcId = params.nfcId?.trim() ?? "";
  const expiresAt = sessionExpiresAt();

  const payload: NfcSessionInsertPayload = {
    profile_id: profileId,
    nfc_id: nfcId,
    fingerprint: null,
    user_agent: params.userAgent?.trim() || null,
    expires_at: expiresAt.toISOString(),
  };

  const validationIssues = validateNfcSessionInsertPayload(payload);

  console.log(
    "[createEphemeralNfcSession] nfc_sessions.insert deneniyor",
    JSON.stringify(
      {
        payload,
        payloadValidation: {
          ok: validationIssues.length === 0,
          issues: validationIssues,
        },
        schemaHint: NFC_SESSIONS_SCHEMA_HINT,
      },
      null,
      2
    )
  );

  if (validationIssues.length > 0) {
    const validationError = {
      code: "PAYLOAD_VALIDATION",
      message: validationIssues.join("; "),
      details: null,
      hint: "profile_id ve nfc_id geçerli UUID olmalı; expires_at ISO 8601 olmalı",
    };

    await logNfcSessionInsertFailure(payload, validationIssues, validationError);
    throw new Error(`NFC oturumu oluşturulamadı: ${validationError.message}`);
  }

  try {
    const { data, error } = await supabase
      .from("nfc_sessions")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      await logNfcSessionInsertFailure(payload, validationIssues, error);
      throw new Error(`NFC oturumu oluşturulamadı: ${error.message}`);
    }

    if (!data?.id) {
      console.error(
        "[createEphemeralNfcSession] nfc_sessions.insert başarısız — id dönmedi",
        JSON.stringify(
          {
            handler: "createEphemeralNfcSession",
            payload,
            returnedRow: data,
            schemaHint: NFC_SESSIONS_SCHEMA_HINT,
          },
          null,
          2
        )
      );
      throw new Error("NFC oturumu oluşturulamadı.");
    }

    console.log(
      "[createEphemeralNfcSession] nfc_sessions.insert başarılı",
      JSON.stringify({ sessionId: data.id, profileId, nfcId }, null, 2)
    );

    return data.id as string;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NFC oturumu")) {
      throw error;
    }

    console.error(
      "[createEphemeralNfcSession] nfc_sessions.insert beklenmeyen hata",
      JSON.stringify(
        {
          handler: "createEphemeralNfcSession",
          payload,
          error:
            error instanceof Error
              ? { name: error.name, message: error.message, stack: error.stack }
              : String(error),
        },
        null,
        2
      )
    );

    throw error instanceof Error
      ? error
      : new Error("NFC oturumu oluşturulamadı.");
  }
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
      .from(NFC_CARD_TABLE)
      .select(NFC_CARD_AUTH_SELECT)
      .eq(NFC_CARD_SLUG_COLUMN, normalizedId)
      .maybeSingle();

    if (error) {
      console.error("[validateNfcCardActive] nfc_user_data sorgu hatası:", error);
      logNfcError(ctx, error, {
        ...nfcCardQueryMeta(normalizedId),
        step: "nfc_user_data.select",
      });
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
    logNfcError(ctx, error, {
      ...nfcCardQueryMeta(normalizedId),
      step: "nfc_user_data.select",
    });
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

  const queryMeta = nfcCardQueryMeta(normalizedId, uniqueId);

  console.log("[resolveNfcCardForAuth] DB sorgusu başlıyor:", queryMeta);

  try {
    const { data, error } = await supabase
      .from(NFC_CARD_TABLE)
      .select(NFC_CARD_AUTH_SELECT)
      .eq(NFC_CARD_SLUG_COLUMN, normalizedId)
      .maybeSingle();

    if (error) {
      console.error("[resolveNfcCardForAuth] nfc_user_data sorgu hatası:", {
        ...queryMeta,
        error,
      });
      logNfcError(ctx, error, {
        ...queryMeta,
        step: "nfc_user_data.select",
      });
      return { ok: false, reason: "db_error" };
    }

    if (!data) {
      console.error("[resolveNfcCardForAuth] Kart bulunamadı — satır yok:", {
        ...queryMeta,
        sqlEquivalent: `select ${NFC_CARD_AUTH_SELECT} from ${NFC_CARD_TABLE} where ${NFC_CARD_SLUG_COLUMN} = '${normalizedId}' limit 1`,
        hint:
          "nfc_user_data tablosunda bu nfc_id yok; Supabase projesi veya seed/backfill kontrol edin.",
      });
      logNfcEvent("warn", ctx, "NFC kartı bulunamadı", queryMeta);
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
