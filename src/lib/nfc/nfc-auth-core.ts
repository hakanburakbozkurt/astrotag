import "server-only";

import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { clearPendingNfcCardCookie } from "@/lib/nfc/device-cookies.server";
import {
  CARD_VERIFY_FAILURE_MESSAGE,
  DASHBOARD_PATH,
  PROFILE_COMPLETE_PATH,
} from "@/lib/nfc/constants";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import {
  NFC_CARD_AUTH_SELECT,
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { setNfcSession } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type VerifyPinResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

type NfcCardAuthRow = {
  id: string;
  profile_id: string | null;
  is_active: boolean;
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

/**
 * nfc_id + doğum tarihi doğrulama (service role — RLS bypass).
 * PIN geçici olarak devre dışı; yalnızca profiles.birth_date eşleşmesi yeterli.
 */
export async function verifyPin(
  uniqueId: string,
  _pin: string,
  birthDate: string
): Promise<VerifyPinResult> {
  const normalizedId = normalizeNfcUniqueId(uniqueId);

  if (!normalizedId) {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  const normalizedBirthDate = normalizeBirthDateToIso(birthDate);

  if (!normalizedBirthDate) {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  const admin = createServiceRoleClient();
  const { data: card, error } = await admin
    .from(NFC_CARD_TABLE)
    .select(NFC_CARD_AUTH_SELECT)
    .eq(NFC_CARD_SLUG_COLUMN, normalizedId)
    .maybeSingle();

  if (error) {
    logNfcEvent(
      "error",
      { layer: "action", handler: "verifyPin" },
      "nfc_user_data sorgusu başarısız",
      { uniqueId: normalizedId, code: error.code, message: error.message }
    );
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  if (!card) {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  const row = card as NfcCardAuthRow;

  if (!row.is_active) {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  if (!row.profile_id) {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  const storedBirthDate = await loadProfileBirthDateIso(row.profile_id);

  if (!storedBirthDate || storedBirthDate !== normalizedBirthDate) {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

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
    { uniqueId: normalizedId, redirectTo, authMode: "birth_date_only" }
  );

  return { ok: true, redirectTo };
}
