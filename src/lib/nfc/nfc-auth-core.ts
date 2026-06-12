import "server-only";

import bcrypt from "bcryptjs";
import {
  CARD_VERIFY_FAILURE_MESSAGE,
} from "@/lib/nfc/constants";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import {
  NFC_CARD_PIN_LOGIN_SELECT,
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { normalizePinInput } from "@/lib/nfc/pin-input";
import { resolveProfileForNfcCard } from "@/lib/nfc/nfc-profile-link.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;
const LOCKOUT_MESSAGE =
  "Çok fazla hatalı deneme. Lütfen daha sonra tekrar deneyin.";
const PIN_NOT_SET_MESSAGE = "Şifre henüz oluşturulmamış.";

export type VerifyPinSuccess = {
  ok: true;
  nfcCardUuid: string;
  profileId: string;
  slug: string;
};

export type VerifyPinResult = VerifyPinSuccess | { ok: false; error: string };

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

function inspectPinHashEdges(
  rawHash: string | null | undefined,
  trimmedHash: string
): Record<string, unknown> {
  const raw = rawHash ?? "";

  return {
    rawLength: raw.length,
    trimmedLength: trimmedHash.length,
    trimmedDiffersFromRaw: raw !== trimmedHash,
    leadingWhitespace: raw.length > 0 && raw !== raw.trimStart(),
    trailingWhitespace: raw.length > 0 && raw !== raw.trimEnd(),
    firstCharCode: trimmedHash.length > 0 ? trimmedHash.charCodeAt(0) : null,
    lastCharCode:
      trimmedHash.length > 0
        ? trimmedHash.charCodeAt(trimmedHash.length - 1)
        : null,
    hashJson: JSON.stringify(trimmedHash),
    looksLikeBcrypt: trimmedHash.startsWith("$2"),
  };
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
    .from(NFC_CARD_TABLE)
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
    .from(NFC_CARD_TABLE)
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

async function ensureProfileForCard(
  cardId: string,
  profileId: string | null,
  slug: string
): Promise<string | null> {
  const admin = createServiceRoleClient();

  return resolveProfileForNfcCard(admin, {
    nfcCardUuid: cardId,
    slug,
    cardProfileId: profileId,
  });
}

/**
 * nfc_user_data.nfc_id + pin_hash doğrulama (bcrypt).
 * Oturum oluşturma handlePinLogin / establishNfcSessionForUser tarafında yapılır.
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
  const pinToVerify = String(inputPin ?? "").trim();
  const normalizedId = normalizeNfcUniqueId(uniqueId);
  const normalizedPin = normalizePinInput(pinToVerify).trim();

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
      .from(NFC_CARD_TABLE)
      .select(NFC_CARD_PIN_LOGIN_SELECT)
      .eq(NFC_CARD_SLUG_COLUMN, normalizedId)
      .maybeSingle();

    console.error("[verifyPin] DB sorgusu tamamlandı (cache yok — doğrudan nfc_user_data)", {
      nfc_id: normalizedId,
      cacheBypass: true,
      durationMs: Math.round(performance.now() - queryStartedAt),
      hasData: Boolean(card),
      dbError: error ? serializeVerifyPinError(error) : null,
    });

    logVerifyPin("card_query", {
      table: NFC_CARD_TABLE,
      slugColumn: NFC_CARD_SLUG_COLUMN,
      slug: normalizedId,
      select: NFC_CARD_PIN_LOGIN_SELECT,
      durationMs: Math.round(performance.now() - queryStartedAt),
      hasData: Boolean(card),
      error: error ? serializeVerifyPinError(error) : null,
      card: sanitizeCardRowForLog(card as NfcCardPinRow | null),
    });

    if (error) {
      logNfcEvent(
        "error",
        { layer: "action", handler: "verifyPin" },
        "nfc_user_data sorgusu başarısız",
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

    const dbPinHashRaw = row.pin_hash ?? "";
    const dbPinHash = dbPinHashRaw.trim();

    console.log("[verifyPin] DB pin_hash doğrulama", {
      unique_id: normalizedId,
      cardId: row.id,
      table: NFC_CARD_TABLE,
      slugColumn: NFC_CARD_SLUG_COLUMN,
      searchedSlug: normalizedId,
      pinHashFromDb: row.pin_hash,
      pinHashRawLength: dbPinHashRaw.length,
      pinHashTrimmed: dbPinHash,
      pinHashTrimmedLength: dbPinHash.length,
      ...inspectPinHashEdges(dbPinHashRaw, dbPinHash),
    });

    if (!dbPinHash) {
      throw new Error(
        `[verifyPin] dbPinHash boş veya undefined — unique_id: ${normalizedId}, cardId: ${row.id}`
      );
    }

    if (typeof bcrypt.compare !== "function") {
      throw new Error("[verifyPin] bcrypt.compare yüklenemedi — bcryptjs import hatası");
    }

    logVerifyPin("pin_compare", {
      inputPin: pinToVerify,
      normalizedPin,
      dbPinHash: maskPinHash(dbPinHash),
      pinFailedAttempts: row.pin_failed_attempts ?? 0,
    });

    console.log("--- BCRYPT DEBUG ---");
    console.log("Input PIN:", pinToVerify);
    console.log("DB Hash:", dbPinHash);
    console.log("Hash Type:", typeof dbPinHash);
    console.log("Input Type:", typeof pinToVerify);
    const match = await bcrypt.compare(pinToVerify, dbPinHash);
    console.log("Bcrypt Result:", match);

    logVerifyPin("pin_compare_result", {
      cardId: row.id,
      pinOk: match,
    });

    if (!match) {
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

    const profileId = await ensureProfileForCard(
      row.id,
      row.profile_id,
      normalizedId
    );

    if (!profileId) {
      logVerifyPin("fail", {
        failReason: "profile_id_missing_on_card",
        cardId: row.id,
        cardProfileId: row.profile_id,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
    }

    logNfcEvent(
      "info",
      { layer: "action", handler: "verifyPin" },
      "PIN doğrulama başarılı — oturum henüz açılmadı",
      { uniqueId: normalizedId, profileId, nfcCardUuid: row.id }
    );

    logVerifyPin("success", {
      cardId: row.id,
      profileId,
      slug: normalizedId,
      durationMs: Math.round(performance.now() - startedAt),
    });

    return {
      ok: true,
      nfcCardUuid: row.id,
      profileId,
      slug: normalizedId,
    };
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
