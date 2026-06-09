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
  NFC_CARD_PIN_SELECT,
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { isProfileSetupComplete } from "@/lib/nfc/profile-readiness.server";
import { normalizePinInput } from "@/lib/nfc/pin-input";
import { setNfcSession } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;
const LOCKOUT_MESSAGE =
  "Çok fazla hatalı deneme. Lütfen daha sonra tekrar deneyin.";

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

async function resolveClaimedProfileId(
  admin: ReturnType<typeof createServiceRoleClient>,
  cardId: string
): Promise<string | null> {
  const { data, error } = await admin
    .from(NFC_CARD_TABLE)
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
    .from(NFC_CARD_TABLE)
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

async function resolveRedirectForProfile(profileId: string): Promise<string> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .select("name, birth_date, birth_time, birth_city, birth_district")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) {
    logNfcEvent(
      "warn",
      { layer: "action", handler: "verifyPin/resolveRedirectForProfile" },
      "Profil okunamadı — kurulum sayfasına yönlendiriliyor",
      { profileId, code: error?.code }
    );
    return PROFILE_SETUP_PATH;
  }

  if (!isProfileSetupComplete(data)) {
    return PROFILE_SETUP_PATH;
  }

  return DASHBOARD_PATH;
}

/**
 * nfc_id + PIN doğrulama (service role — RLS bypass).
 * Başarılı girişte oturum açılır; profil eksikse /profile-setup.
 */
export async function verifyPin(
  uniqueId: string,
  pin: string
): Promise<VerifyPinResult> {
  const normalizedId = normalizeNfcUniqueId(uniqueId);
  const normalizedPin = normalizePinInput(pin);

  if (!normalizedId || normalizedPin.length < 4 || normalizedPin.length > 8) {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  const admin = createServiceRoleClient();
  const { data: card, error } = await admin
    .from(NFC_CARD_TABLE)
    .select(NFC_CARD_PIN_SELECT)
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

  const row = card as NfcCardPinRow;

  if (!row.is_active) {
    return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
  }

  if (isPinLocked(row.pin_locked_until)) {
    return { ok: false, error: LOCKOUT_MESSAGE };
  }

  if (!row.pin_hash) {
    const profileId = await ensureProfileForCard(row.id, row.profile_id);

    if (!profileId) {
      return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
    }

    try {
      await setNfcSession({ profileId, nfcCardUuid: row.id });
      await confirmStorageAccessAction();
      await clearPendingNfcCardCookie();
    } catch {
      return { ok: false, error: CARD_VERIFY_FAILURE_MESSAGE };
    }

    return { ok: true, redirectTo: PROFILE_SETUP_PATH };
  }

  const pinOk = await bcrypt.compare(normalizedPin, row.pin_hash);

  if (!pinOk) {
    return failVerification(row.id, row.pin_failed_attempts ?? 0);
  }

  await resetPinAttempts(row.id);

  const profileId = await ensureProfileForCard(row.id, row.profile_id);

  if (!profileId) {
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

  const redirectTo = await resolveRedirectForProfile(profileId);

  logNfcEvent(
    "info",
    { layer: "action", handler: "verifyPin" },
    "PIN doğrulama başarılı — NFC oturumu açıldı",
    { uniqueId: normalizedId, redirectTo, profileId }
  );

  return { ok: true, redirectTo };
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
