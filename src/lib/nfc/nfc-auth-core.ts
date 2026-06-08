import "server-only";

import bcrypt from "bcryptjs";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import {
  CARD_VERIFY_FAILURE_MESSAGE,
  DASHBOARD_PATH,
  PROFILE_COMPLETE_PATH,
} from "@/lib/nfc/constants";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import { setNfcSession } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;

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

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Form veya DB değerini ISO YYYY-MM-DD formatına çevirir.
 * YYYY-MM-DD, DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY ve ISO datetime desteklenir.
 */
export function normalizeBirthDateToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoPrefix = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoPrefix) {
    const year = Number(isoPrefix[1]);
    const month = Number(isoPrefix[2]);
    const day = Number(isoPrefix[3]);
    if (!isValidDateParts(year, month, day)) {
      return null;
    }
    return `${isoPrefix[1]}-${isoPrefix[2]}-${isoPrefix[3]}`;
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    if (!isValidDateParts(year, month, day)) {
      return null;
    }
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const ymdMatch = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    if (!isValidDateParts(year, month, day)) {
      return null;
    }
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

function normalizePinInput(pin: string): string {
  return pin.replace(/\D/g, "").trim();
}

function isPinLocked(lockedUntil: string | null): boolean {
  if (!lockedUntil) {
    return false;
  }

  return new Date(lockedUntil).getTime() > Date.now();
}

/** RLS bypass — service role ile hatalı deneme sayacı ve kilit güncellenir. */
async function recordPinFailure(cardId: string, currentAttempts: number): Promise<void> {
  const admin = createServiceRoleClient();
  const nextAttempts = currentAttempts + 1;
  const shouldLock = nextAttempts >= PIN_MAX_ATTEMPTS;

  const lockedUntil = shouldLock
    ? new Date(Date.now() + PIN_LOCK_MS).toISOString()
    : null;

  const { error } = await admin
    .from("nfc_cards")
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
    .from("nfc_cards")
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

async function resolveRedirectForProfile(profileId: string): Promise<string> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .select("name")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    logNfcEvent(
      "warn",
      { layer: "action", handler: "verifyPin/resolveRedirectForProfile" },
      "Profil adı okunamadı — tamamlama sayfasına yönlendiriliyor",
      { profileId, code: error.code, message: error.message }
    );
    return PROFILE_COMPLETE_PATH;
  }

  return data?.name?.trim() ? DASHBOARD_PATH : PROFILE_COMPLETE_PATH;
}

async function loadProfileBirthDateIso(profileId: string): Promise<string | null> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .select("birth_date")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data?.birth_date) {
    return null;
  }

  return normalizeBirthDateToIso(String(data.birth_date));
}

const LOCKOUT_MESSAGE =
  "Çok fazla hatalı deneme. Lütfen daha sonra tekrar deneyin.";

/**
 * unique_id + doğum tarihi + PIN doğrulama (service role — RLS bypass).
 * Başarılı doğrulamada nfc_sessions + çerez oturumu açılır.
 */
export async function verifyPin(
  uniqueId: string,
  pin: string,
  birthDate: string
): Promise<VerifyPinResult> {
  const normalizedId = normalizeNfcUniqueId(uniqueId);

  if (!normalizedId) {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  const admin = createServiceRoleClient();
  const { data: card, error } = await admin
    .from("nfc_cards")
    .select(
      "id, profile_id, is_active, pin_hash, pin_failed_attempts, pin_locked_until"
    )
    .eq("unique_id", normalizedId)
    .maybeSingle();

  if (error) {
    logNfcEvent(
      "error",
      { layer: "action", handler: "verifyPin" },
      "nfc_cards sorgusu başarısız",
      { uniqueId: normalizedId, code: error.code, message: error.message }
    );
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  if (!card) {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  const row = card as NfcCardPinRow;

  if (!row.is_active) {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  if (isPinLocked(row.pin_locked_until)) {
    return { ok: false, error: LOCKOUT_MESSAGE };
  }

  const normalizedPin = normalizePinInput(pin);
  const normalizedBirthDate = normalizeBirthDateToIso(birthDate);

  if (
    !normalizedBirthDate ||
    normalizedPin.length < 4 ||
    normalizedPin.length > 8
  ) {
    return failVerification(row.id, row.pin_failed_attempts ?? 0);
  }

  if (!row.profile_id || !row.pin_hash) {
    return failVerification(row.id, row.pin_failed_attempts ?? 0);
  }

  const storedBirthDate = await loadProfileBirthDateIso(row.profile_id);

  if (!storedBirthDate || storedBirthDate !== normalizedBirthDate) {
    return failVerification(row.id, row.pin_failed_attempts ?? 0);
  }

  const pinOk = await bcrypt.compare(normalizedPin, row.pin_hash);

  if (!pinOk) {
    return failVerification(row.id, row.pin_failed_attempts ?? 0);
  }

  await resetPinAttempts(row.id);

  try {
    await setNfcSession({
      profileId: row.profile_id,
      nfcCardUuid: row.id,
    });
  } catch (sessionError) {
    logNfcEvent(
      "error",
      { layer: "action", handler: "verifyPin/setNfcSession" },
      "NFC oturumu oluşturulamadı",
      {
        uniqueId: normalizedId,
        profileId: row.profile_id,
        message:
          sessionError instanceof Error ? sessionError.message : String(sessionError),
      }
    );
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  try {
    await confirmStorageAccessAction();
  } catch {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  await clearPendingNfcCardCookie();

  const redirectTo = await resolveRedirectForProfile(row.profile_id);

  logNfcEvent(
    "info",
    { layer: "action", handler: "verifyPin" },
    "Doğrulama başarılı — NFC oturumu açıldı",
    { uniqueId: normalizedId, redirectTo }
  );

  return { ok: true, redirectTo };
}
