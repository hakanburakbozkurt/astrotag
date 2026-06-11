import "server-only";

import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import {
  CARD_VERIFY_FAILURE_MESSAGE,
  DASHBOARD_PATH,
  PROFILE_SETUP_PATH,
} from "@/lib/nfc/constants";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import {
  NFC_CARD_TABLE,
  NFC_CARDS_PIN_LOGIN_SELECT,
  NFC_CARDS_SLUG_COLUMN,
  NFC_CARDS_TABLE,
} from "@/lib/nfc/nfc-card-table";
import {
  isNfcCardProfileComplete,
  type NfcCardProfileFields,
} from "@/lib/nfc/profile-readiness.server";
import { normalizePinInput } from "@/lib/nfc/pin-input";
import { setNfcSession } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;
const LOCKOUT_MESSAGE =
  "Çok fazla hatalı deneme. Lütfen daha sonra tekrar deneyin.";
const PIN_NOT_SET_MESSAGE = "Şifre henüz oluşturulmamış.";

export type VerifyPinResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

type NfcCardPinRow = {
  id: string;
  profile_id: string | null;
  is_active: boolean;
  pin_hash: string | null;
  pin_failed_attempts: number;
  pin_locked_until: string | null;
};

const VERIFY_PIN_LOG = "[verifyPin]";

function isPinHashMissing(pinHash: string | null | undefined): boolean {
  const trimmed = pinHash?.trim() ?? "";
  if (!trimmed) {
    return true;
  }

  return trimmed.toUpperCase() === "EMPTY";
}

function maskPinHash(hash: string | null | undefined): string | null {
  if (!hash || isPinHashMissing(hash)) {
    return null;
  }

  if (hash.length <= 12) {
    return "***";
  }

  return `${hash.slice(0, 7)}…${hash.slice(-4)}`;
}

function sanitizeCardRowForLog(row: NfcCardPinRow | null | undefined) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    pin_hash: maskPinHash(row.pin_hash),
  };
}

async function loadProfileFieldsForRedirect(
  admin: ReturnType<typeof createServiceRoleClient>,
  profileId: string
): Promise<NfcCardProfileFields> {
  const { data, error } = await admin
    .from("profiles")
    .select("name, birth_date, birth_time, birth_city, birth_district")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) {
    return {
      full_name: null,
      birth_date: null,
      birth_time: null,
      birth_location: null,
    };
  }

  const location = [data.birth_city, data.birth_district]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

  return {
    full_name: data.name,
    birth_date: data.birth_date,
    birth_time: data.birth_time,
    birth_location: location || null,
  };
}

function serializeVerifyPinError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === "object") {
    return { ...(error as Record<string, unknown>) };
  }

  return { raw: String(error) };
}

function logVerifyPin(step: string, payload: Record<string, unknown>): void {
  console.log(`${VERIFY_PIN_LOG} ${step}`, JSON.stringify(payload, null, 2));
}

function isPinLocked(lockedUntil: string | null): boolean {
  if (!lockedUntil) {
    return false;
  }

  return new Date(lockedUntil).getTime() > Date.now();
}

async function recordPinFailure(
  cardId: string,
  currentAttempts: number
): Promise<void> {
  const admin = createServiceRoleClient();
  const nextAttempts = currentAttempts + 1;
  const shouldLock = nextAttempts >= PIN_MAX_ATTEMPTS;
  const lockedUntil = shouldLock
    ? new Date(Date.now() + PIN_LOCK_MS).toISOString()
    : null;

  const { error } = await admin
    .from(NFC_CARDS_TABLE)
    .update({
      pin_failed_attempts: nextAttempts,
      pin_locked_until: lockedUntil,
    })
    .eq("id", cardId);

  if (error) {
    logNfcEvent(
      "warn",
      { layer: "action", handler: "verifyPin/recordPinFailure" },
      "Hatalı deneme sayacı güncellenemedi",
      { cardId, code: error.code, message: error.message }
    );
  }
}

async function resetPinAttempts(cardId: string): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from(NFC_CARDS_TABLE)
    .update({
      pin_failed_attempts: 0,
      pin_locked_until: null,
    })
    .eq("id", cardId);

  if (error) {
    logNfcEvent(
      "warn",
      { layer: "action", handler: "verifyPin/resetPinAttempts" },
      "PIN deneme sayacı sıfırlanamadı",
      { cardId, code: error.code, message: error.message }
    );
  }
}

async function failVerification(
  cardId: string,
  currentAttempts: number
): Promise<VerifyPinResult> {
  const nextAttempts = currentAttempts + 1;
  await recordPinFailure(cardId, currentAttempts);

  if (nextAttempts >= PIN_MAX_ATTEMPTS) {
    return { ok: false, error: LOCKOUT_MESSAGE };
  }

  return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
}

async function resolveClaimedProfileId(
  admin: ReturnType<typeof createServiceRoleClient>,
  cardId: string
): Promise<string | null> {
  const { data, error } = await admin
    .from(NFC_CARDS_TABLE)
    .select("profile_id")
    .eq("id", cardId)
    .maybeSingle();

  if (error) {
    logNfcEvent(
      "error",
      { layer: "action", handler: "verifyPin/resolveClaimedProfileId" },
      "Kart sahipliği okunamadı",
      { cardId, code: error.code, message: error.message }
    );
    return null;
  }

  return data?.profile_id ?? null;
}

async function ensureProfileForCard(
  cardId: string,
  profileId: string | null
): Promise<string | null> {
  if (profileId) {
    return profileId;
  }

  const admin = createServiceRoleClient();

  const existingProfileId = await resolveClaimedProfileId(admin, cardId);
  if (existingProfileId) {
    return existingProfileId;
  }

  const newProfileId = randomUUID();

  const { error: insertError } = await admin.from("profiles").insert({
    id: newProfileId,
    name: "",
    birth_date: "1970-01-01",
    birth_time: "00:00:00",
    birth_place: "",
    birth_city: "",
    birth_district: "",
    relationship_status: "İlişki Yok",
    cosmic_energy: 0,
    energy_bonus: 0,
  });

  if (insertError) {
    logNfcEvent(
      "error",
      { layer: "action", handler: "verifyPin/ensureProfileForCard" },
      "Profil oluşturulamadı",
      { cardId, code: insertError.code, message: insertError.message }
    );
    return null;
  }

  const { data: linked, error: linkError } = await admin
    .from(NFC_CARDS_TABLE)
    .update({
      profile_id: newProfileId,
      is_claimed: true,
    })
    .eq("id", cardId)
    .is("profile_id", null)
    .select("profile_id")
    .maybeSingle();

  if (linkError) {
    logNfcEvent(
      "error",
      { layer: "action", handler: "verifyPin/ensureProfileForCard" },
      "Karta profil bağlanamadı",
      { cardId, profileId: newProfileId, code: linkError.code }
    );
    return null;
  }

  if (linked?.profile_id) {
    return linked.profile_id;
  }

  return resolveClaimedProfileId(admin, cardId);
}

async function resolveRedirectAfterLogin(
  card: NfcCardProfileFields
): Promise<string> {
  if (!isNfcCardProfileComplete(card)) {
    return PROFILE_SETUP_PATH;
  }

  return DASHBOARD_PATH;
}

/**
 * nfc_cards.unique_id + pin_hash doğrulama (bcrypt).
 * Başarılı girişte nfc_sessions insert — profile_id kart satırından gelir.
 */
export async function verifyPin(
  uniqueId: string,
  inputPin: string
): Promise<VerifyPinResult> {
  console.log("--- [DEBUG] API VERIFY PIN TETIKLENDI ---");
  console.log("[verifyPin] function entered (try-catch DISINDA)", {
    uniqueId,
    inputPinLength: String(inputPin ?? "").length,
    at: new Date().toISOString(),
  });

  const startedAt = performance.now();
  const pinToVerify = String(inputPin).trim();
  const normalizedId = normalizeNfcUniqueId(uniqueId);
  const normalizedPin = normalizePinInput(pinToVerify);

  logVerifyPin("start", {
    uniqueIdRaw: uniqueId,
    uniqueIdNormalized: normalizedId,
    inputPinRaw: inputPin,
    pinToVerify,
    normalizedPinLength: normalizedPin.length,
    normalizedPinMasked:
      normalizedPin.length > 0 ? "*".repeat(normalizedPin.length) : "",
  });

  try {
    if (!normalizedId || normalizedPin.length < 4 || normalizedPin.length > 8) {
      logVerifyPin("fail", {
        failReason: "invalid_input",
        normalizedId: normalizedId || null,
        normalizedPinLength: normalizedPin.length,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
    }

    const admin = createServiceRoleClient();
    const queryStartedAt = performance.now();

    // PIN doğrulama: resolveNfcCardForAuth / unstable_cache kullanılmaz — her seferinde taze DB
    const { data: card, error } = await admin
      .from(NFC_CARDS_TABLE)
      .select(NFC_CARDS_PIN_LOGIN_SELECT)
      .eq(NFC_CARDS_SLUG_COLUMN, normalizedId)
      .maybeSingle();

    console.error("[verifyPin] DB sorgusu tamamlandı (cache yok — doğrudan nfc_cards)", {
      unique_id: normalizedId,
      cacheBypass: true,
      durationMs: Math.round(performance.now() - queryStartedAt),
      hasData: Boolean(card),
      dbError: error ? serializeVerifyPinError(error) : null,
    });

    logVerifyPin("card_query", {
      table: NFC_CARDS_TABLE,
      slugColumn: NFC_CARDS_SLUG_COLUMN,
      slug: normalizedId,
      select: NFC_CARDS_PIN_LOGIN_SELECT,
      durationMs: Math.round(performance.now() - queryStartedAt),
      hasData: Boolean(card),
      error: error ? serializeVerifyPinError(error) : null,
      card: sanitizeCardRowForLog(card as NfcCardPinRow | null),
    });

    if (error) {
      logNfcEvent(
        "error",
        { layer: "action", handler: "verifyPin" },
        "nfc_cards sorgusu başarısız",
        { uniqueId: normalizedId, code: error.code, message: error.message }
      );
      logVerifyPin("fail", {
        failReason: "db_query_error",
        error: serializeVerifyPinError(error),
        durationMs: Math.round(performance.now() - startedAt),
      });
      return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
    }

    if (!card) {
      logVerifyPin("fail", {
        failReason: "card_not_found",
        slug: normalizedId,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
    }

    const row = card as NfcCardPinRow;

    if (!row.is_active) {
      logVerifyPin("fail", {
        failReason: "card_inactive",
        cardId: row.id,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
    }

    if (isPinLocked(row.pin_locked_until)) {
      logVerifyPin("fail", {
        failReason: "pin_locked",
        cardId: row.id,
        pinLockedUntil: row.pin_locked_until,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return { ok: false, error: LOCKOUT_MESSAGE };
    }

    if (isPinHashMissing(row.pin_hash)) {
      logVerifyPin("fail", {
        failReason: "pin_hash_not_set",
        cardId: row.id,
        pinHashPlaceholder: row.pin_hash?.trim() || null,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return { ok: false, error: PIN_NOT_SET_MESSAGE };
    }

    const dbPinHash = row.pin_hash!.trim();

    console.error(
      "DEBUG: DB Pin Hash Değeri:",
      {
        unique_id: normalizedId,
        dbPinHash,
        uzunluk: dbPinHash?.length,
        tip: typeof dbPinHash,
      }
    );
    console.error("DEBUG: Girdiğim Pin:", {
      unique_id: normalizedId,
      normalizedPin,
    });

    logVerifyPin("pin_compare", {
      normalizedPinLength: normalizedPin.length,
      dbPinHash: maskPinHash(dbPinHash),
      pinFailedAttempts: row.pin_failed_attempts ?? 0,
    });

    console.error("--- COMPARE DEBUG --- compare öncesi", {
      unique_id: normalizedId,
      gelen: normalizedPin,
      hash: dbPinHash,
      hashUzunluk: dbPinHash.length,
      hashTip: typeof dbPinHash,
    });
    const pinOk = await bcrypt.compare(normalizedPin, dbPinHash);
    console.error("--- COMPARE DEBUG --- compare sonrası", {
      unique_id: normalizedId,
      gelen: normalizedPin,
      hash: dbPinHash,
      sonuc: pinOk,
    });

    logVerifyPin("pin_compare_result", {
      cardId: row.id,
      pinOk,
    });

    if (!pinOk) {
      const failResult = await failVerification(
        row.id,
        row.pin_failed_attempts ?? 0
      );
      logVerifyPin("fail", {
        failReason: "pin_mismatch",
        cardId: row.id,
        nextError: failResult.ok ? null : failResult.error,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return failResult;
    }

    await resetPinAttempts(row.id);

    const profileId =
      row.profile_id?.trim() ||
      (await ensureProfileForCard(row.id, row.profile_id));

    if (!profileId) {
      logVerifyPin("fail", {
        failReason: "profile_id_missing_on_card",
        cardId: row.id,
        cardProfileId: row.profile_id,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
    }

    try {
      await setNfcSession({
        profileId,
        nfcCardUuid: row.id,
      });
    } catch (sessionError) {
      logNfcEvent(
        "error",
        { layer: "action", handler: "verifyPin/setNfcSession" },
        "NFC oturumu oluşturulamadı",
        {
          uniqueId: normalizedId,
          profileId,
          message:
            sessionError instanceof Error
              ? sessionError.message
              : String(sessionError),
        }
      );
      logVerifyPin("fail", {
        failReason: "set_nfc_session_failed",
        cardId: row.id,
        profileId,
        error: serializeVerifyPinError(sessionError),
        durationMs: Math.round(performance.now() - startedAt),
      });
      return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
    }

    try {
      await confirmStorageAccessAction();
    } catch (storageError) {
      logVerifyPin("fail", {
        failReason: "confirm_storage_failed",
        cardId: row.id,
        profileId,
        error: serializeVerifyPinError(storageError),
        durationMs: Math.round(performance.now() - startedAt),
      });
      return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
    }

    await clearPendingNfcCardCookie();

    const profileFields = await loadProfileFieldsForRedirect(admin, profileId);

    const redirectTo = await resolveRedirectAfterLogin(profileFields);

    logNfcEvent(
      "info",
      { layer: "action", handler: "verifyPin" },
      "PIN doğrulama başarılı — NFC oturumu açıldı",
      { uniqueId: normalizedId, redirectTo, profileId }
    );

    logVerifyPin("success", {
      cardId: row.id,
      profileId,
      redirectTo,
      profileComplete: isNfcCardProfileComplete(profileFields),
      durationMs: Math.round(performance.now() - startedAt),
    });

    return { ok: true, redirectTo };
  } catch (error) {
    logVerifyPin("exception", {
      uniqueIdRaw: uniqueId,
      uniqueIdNormalized: normalizedId,
      inputPinRaw: inputPin,
      pinToVerify,
      normalizedPinLength: normalizedPin.length,
      error: serializeVerifyPinError(error),
      durationMs: Math.round(performance.now() - startedAt),
    });

    logNfcEvent(
      "error",
      { layer: "action", handler: "verifyPin" },
      "verifyPin beklenmeyen hata",
      {
        uniqueId: normalizedId,
        message: error instanceof Error ? error.message : String(error),
      }
    );

    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  } finally {
    console.log("[verifyPin] function finished (try-catch finally)", {
      uniqueId,
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
}

/** Profil kurulum / ayarlar — kart PIN hash güncelleme */
export async function hashAndStorePin(
  nfcCardUuid: string,
  pin: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedPin = normalizePinInput(pin);

  if (normalizedPin.length < 4 || normalizedPin.length > 8) {
    return { ok: false, error: "PIN 4–8 haneli olmalıdır." };
  }

  const pinHash = await bcrypt.hash(normalizedPin, 10);
  const admin = createServiceRoleClient();

  const { error } = await admin
    .from(NFC_CARD_TABLE)
    .update({
      pin_hash: pinHash,
      pin_set_at: new Date().toISOString(),
      pin_failed_attempts: 0,
      pin_locked_until: null,
    })
    .eq("id", nfcCardUuid);

  if (error) {
    logNfcEvent(
      "error",
      { layer: "action", handler: "hashAndStorePin" },
      "PIN kaydedilemedi",
      { nfcCardUuid, code: error.code, message: error.message }
    );
    return { ok: false, error: "PIN kaydedilemedi." };
  }

  return { ok: true };
}
