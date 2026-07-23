import "server-only";

import { randomInt, randomUUID } from "crypto";
import { assertAccountLoginAllowed } from "@/lib/nfc/account-status.server";
import {
  expertNfcSlugForCode,
  isValidExpertCode,
  normalizeExpertCode,
} from "@/lib/expert/expert-codes.shared";
import { INVALID_PIN_MESSAGE } from "@/lib/nfc/constants";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";
import { normalizePinInput, isPinInputReady } from "@/lib/nfc/pin-input";
import { setNfcSession } from "@/lib/nfc/session.server";
import { STARTING_STAR_POINTS } from "@/lib/constants/cosmic";
import { generateReferralCode } from "@/lib/referral";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PROFILES_TABLE = "profiles";
const ACCESS_CODES_TABLE = "access_codes";
const PLACEHOLDER_BIRTH_DATE = "1970-01-01";

export type ExpertAuthError = { ok: false; error: string };
export type ExpertLoginSuccess = { ok: true; profileId: string; redirectTo: string };
export type ExpertRegisterSuccess = {
  ok: true;
  profileId: string;
  expertCode: string;
  redirectTo: string;
};

async function generateUniqueExpertCode(
  admin: ReturnType<typeof createServiceRoleClient>
): Promise<string | null> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const candidate = String(randomInt(10_000_000, 100_000_000));

    const { data } = await admin
      .from(PROFILES_TABLE)
      .select("id")
      .eq("expert_code", candidate)
      .maybeSingle();

    if (!data?.id) {
      return candidate;
    }
  }

  return null;
}

async function redeemExpertInviteCode(
  admin: ReturnType<typeof createServiceRoleClient>,
  inviteCode: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: accessCode, error: lookupError } = await admin
    .from(ACCESS_CODES_TABLE)
    .select("id, active, type")
    .eq("code", inviteCode)
    .eq("type", "EXP")
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: "Davet kodu doğrulanamadı. Lütfen tekrar deneyin." };
  }

  if (!accessCode?.id || !accessCode.active) {
    return { ok: false, error: "Geçersiz veya kullanılmış davet kodu." };
  }

  const { error: redeemError } = await admin
    .from(ACCESS_CODES_TABLE)
    .update({
      active: false,
      redeemed_at: new Date().toISOString(),
    })
    .eq("id", accessCode.id)
    .eq("active", true);

  if (redeemError) {
    return { ok: false, error: "Davet kodu kullanılamadı. Lütfen tekrar deneyin." };
  }

  return { ok: true };
}

async function ensureExpertVirtualCard(
  admin: ReturnType<typeof createServiceRoleClient>,
  profileId: string,
  expertCode: string
): Promise<string | null> {
  const slug = expertNfcSlugForCode(expertCode);

  const { data: existing } = await admin
    .from(NFC_CARD_TABLE)
    .select("id, profile_id")
    .eq("nfc_id", slug)
    .maybeSingle();

  if (existing?.id) {
    if (existing.profile_id !== profileId) {
      await admin
        .from(NFC_CARD_TABLE)
        .update({ profile_id: profileId, is_active: true })
        .eq("id", existing.id);
    }
    return existing.id;
  }

  const { data: created, error } = await admin
    .from(NFC_CARD_TABLE)
    .insert({
      nfc_id: slug,
      profile_id: profileId,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    return null;
  }

  return created.id;
}

export async function registerExpertAccount(input: {
  inviteCode: string;
  name: string;
  pin: string;
}): Promise<ExpertRegisterSuccess | ExpertAuthError> {
  const inviteCode = normalizeExpertCode(input.inviteCode);
  const name = input.name.trim();
  const pin = normalizePinInput(input.pin);

  if (!isValidExpertCode(inviteCode)) {
    return { ok: false, error: "8 haneli geçerli bir davet kodu girin." };
  }

  if (!name || name.length < 2) {
    return { ok: false, error: "Adınız en az 2 karakter olmalıdır." };
  }

  if (!isPinInputReady(pin)) {
    return { ok: false, error: "PIN en az 4, en fazla 8 haneli olmalıdır." };
  }

  const admin = createServiceRoleClient();
  const expertCode = await generateUniqueExpertCode(admin);

  if (!expertCode) {
    return { ok: false, error: "Uzman kodu oluşturulamadı. Lütfen tekrar deneyin." };
  }

  const redeemed = await redeemExpertInviteCode(admin, inviteCode);
  if (!redeemed.ok) {
    return redeemed;
  }

  const profileId = randomUUID();
  const slug = expertNfcSlugForCode(expertCode);

  const { error: profileError } = await admin.from(PROFILES_TABLE).insert({
    id: profileId,
    name,
    birth_date: PLACEHOLDER_BIRTH_DATE,
    birth_time: "00:00:00",
    birth_place: "",
    birth_city: "",
    birth_district: "",
    relationship_status: "İlişki Yok",
    star_points: STARTING_STAR_POINTS,
    star_points_bonus: 0,
    referral_code: generateReferralCode(),
    nfc_uid: slug,
    expert_code: expertCode,
    pin_code: pin,
    user_role: "expert",
    is_active: true,
  });

  if (profileError) {
    return {
      ok: false,
      error: "Uzman hesabı oluşturulamadı. Lütfen tekrar deneyin.",
    };
  }

  const nfcCardUuid = await ensureExpertVirtualCard(admin, profileId, expertCode);
  if (!nfcCardUuid) {
    return {
      ok: false,
      error: "Uzman oturum kartı oluşturulamadı. Lütfen tekrar deneyin.",
    };
  }

  try {
    await assertAccountLoginAllowed({ profileId, nfcCardUuid, uniqueId: slug });
    await setNfcSession({ profileId, nfcCardUuid });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Oturum açılamadı.",
    };
  }

  return {
    ok: true,
    profileId,
    expertCode,
    redirectTo: "/dashboard",
  };
}

export async function loginExpertAccount(input: {
  expertCode: string;
  pin: string;
}): Promise<ExpertLoginSuccess | ExpertAuthError> {
  const expertCode = normalizeExpertCode(input.expertCode);
  const pin = normalizePinInput(input.pin);

  if (!isValidExpertCode(expertCode)) {
    return { ok: false, error: "8 haneli uzman kodunuzu girin." };
  }

  if (!isPinInputReady(pin)) {
    return { ok: false, error: "PIN en az 4, en fazla 8 haneli olmalıdır." };
  }

  const admin = createServiceRoleClient();

  const { data: profile, error: profileError } = await admin
    .from(PROFILES_TABLE)
    .select("id, pin_code, is_active, user_role")
    .eq("expert_code", expertCode)
    .maybeSingle();

  if (profileError || !profile?.id) {
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  if (profile.user_role !== "expert") {
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  if (profile.is_active === false) {
    return { ok: false, error: "Hesabınız askıya alınmıştır." };
  }

  const storedPin = profile.pin_code?.trim() ?? "";
  if (!storedPin || storedPin !== pin) {
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  const nfcCardUuid = await ensureExpertVirtualCard(
    admin,
    profile.id,
    expertCode
  );

  if (!nfcCardUuid) {
    return { ok: false, error: "Uzman oturumu başlatılamadı." };
  }

  const slug = expertNfcSlugForCode(expertCode);

  try {
    await assertAccountLoginAllowed({
      profileId: profile.id,
      nfcCardUuid,
      uniqueId: slug,
    });
    await setNfcSession({ profileId: profile.id, nfcCardUuid });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Oturum açılamadı.",
    };
  }

  return {
    ok: true,
    profileId: profile.id,
    redirectTo: "/dashboard",
  };
}
