import "server-only";

import { randomInt, randomUUID } from "crypto";
import { assertAccountLoginAllowed } from "@/lib/nfc/account-status.server";
import { expertNfcSlugForCode } from "@/lib/expert/expert-codes.shared";
import {
  EXPERT_APPROVAL_PENDING,
} from "@/lib/expert/expert-approval.shared";
import {
  findAuthUserIdByEmail,
  getAuthUserEmail,
  isValidExpertEmail,
  normalizeExpertEmail,
} from "@/lib/expert/expert-auth-email.server";
import {
  clearExpertPendingCookie,
  getExpertPendingCookie,
  setExpertPendingCookie,
  type ExpertPendingPayload,
} from "@/lib/expert/expert-pending-cookie.server";
import { EXPERT_AUTH_CALLBACK_PATH, EXPERT_LOGIN_PATH } from "@/lib/expert/expert-paths";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";
import { setNfcSession } from "@/lib/nfc/session.server";
import { SITE_URL } from "@/lib/nfc/constants";
import { STARTING_STAR_POINTS } from "@/lib/constants/cosmic";
import { generateReferralCode } from "@/lib/referral";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { authEmailExists } from "@/lib/auth/auth-email-exists.server";

const PROFILES_TABLE = "profiles";
const EXPERT_PROFILES_TABLE = "expert_profiles";
const PLACEHOLDER_BIRTH_DATE = "1970-01-01";

export type ExpertAuthError = { ok: false; error: string };

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

async function findExpertProfileByAuthUserId(authUserId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from(PROFILES_TABLE)
    .select("id, expert_code, user_role, is_active, name")
    .eq("user_id", authUserId)
    .maybeSingle();

  if (!data?.id || data.user_role !== "expert") {
    return null;
  }

  return data;
}

async function establishExpertNfcSession(
  profileId: string,
  expertCode: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createServiceRoleClient();
  const slug = expertNfcSlugForCode(expertCode);
  const nfcCardUuid = await ensureExpertVirtualCard(admin, profileId, expertCode);

  if (!nfcCardUuid) {
    return { ok: false, error: "Uzman oturumu başlatılamadı." };
  }

  try {
    await assertAccountLoginAllowed({
      profileId,
      nfcCardUuid,
      uniqueId: slug,
    });
    await setNfcSession({ profileId, nfcCardUuid });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Oturum açılamadı.",
    };
  }
}

export async function sendExpertLoginMagicLink(
  rawEmail: string
): Promise<{ ok: true } | ExpertAuthError> {
  const email = normalizeExpertEmail(rawEmail);

  if (!isValidExpertEmail(email)) {
    return { ok: false, error: "Geçerli bir e-posta adresi girin." };
  }

  const authUserId = await findAuthUserIdByEmail(email);
  if (!authUserId) {
    return {
      ok: false,
      error: "Bu e-posta ile kayıtlı uzman bulunamadı. Önce kayıt olun.",
    };
  }

  const expertProfile = await findExpertProfileByAuthUserId(authUserId);
  if (!expertProfile) {
    return {
      ok: false,
      error: "Bu e-posta uzman platformuna bağlı değil.",
    };
  }

  if (expertProfile.is_active === false) {
    return { ok: false, error: "Hesabınız askıya alınmıştır." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${SITE_URL}${EXPERT_AUTH_CALLBACK_PATH}`,
    },
  });

  if (error) {
    console.error("[sendExpertLoginMagicLink]", error.message);
    return { ok: false, error: "Giriş bağlantısı gönderilemedi." };
  }

  await setExpertPendingCookie({ mode: "login", email });
  return { ok: true };
}

export async function sendExpertRegisterMagicLink(input: {
  email: string;
  name: string;
  title: string;
  tradition: string;
  experienceYears: number;
  aboutText: string;
}): Promise<{ ok: true } | ExpertAuthError> {
  const email = normalizeExpertEmail(input.email);
  const name = input.name.trim();
  const title = input.title.trim();
  const tradition = input.tradition.trim();
  const aboutText = input.aboutText.trim();
  const experienceYears = Math.max(0, Math.floor(input.experienceYears));

  if (!isValidExpertEmail(email)) {
    return { ok: false, error: "Geçerli bir e-posta adresi girin." };
  }

  if (name.length < 2) {
    return { ok: false, error: "Adınız en az 2 karakter olmalıdır." };
  }

  if (title.length < 2) {
    return { ok: false, error: "Unvan en az 2 karakter olmalıdır." };
  }

  if (tradition.length < 2) {
    return { ok: false, error: "Uzmanlık alanı seçin veya girin." };
  }

  if (await authEmailExists(email)) {
    return {
      ok: false,
      error: "Bu e-posta zaten kayıtlı. Giriş sayfasını kullanın.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${SITE_URL}${EXPERT_AUTH_CALLBACK_PATH}`,
    },
  });

  if (error) {
    console.error("[sendExpertRegisterMagicLink]", error.message);
    return { ok: false, error: "Kayıt bağlantısı gönderilemedi." };
  }

  await setExpertPendingCookie({
    mode: "register",
    email,
    name,
    title,
    tradition,
    experienceYears,
    aboutText,
  });

  return { ok: true };
}

async function createExpertProfileFromPending(
  authUserId: string,
  pending: Extract<ExpertPendingPayload, { mode: "register" }>
): Promise<
  | { ok: true; profileId: string; expertCode: string }
  | { ok: false; error: string }
> {
  const admin = createServiceRoleClient();
  const expertCode = await generateUniqueExpertCode(admin);

  if (!expertCode) {
    return { ok: false, error: "Uzman kodu oluşturulamadı." };
  }

  const profileId = randomUUID();
  const slug = expertNfcSlugForCode(expertCode);

  const { error: profileError } = await admin.from(PROFILES_TABLE).insert({
    id: profileId,
    user_id: authUserId,
    name: pending.name.trim(),
    birth_date: PLACEHOLDER_BIRTH_DATE,
    birth_time: "00:00:00",
    birth_place: "",
    birth_city: "",
    birth_district: "",
    relationship_status: "İlişki Yok",
    star_points: STARTING_STAR_POINTS,
    star_points_bonus: 0,
    crystal_balance: 0,
    referral_code: generateReferralCode(),
    nfc_uid: slug,
    expert_code: expertCode,
    user_role: "expert",
    is_active: true,
  });

  if (profileError) {
    return { ok: false, error: "Uzman hesabı oluşturulamadı." };
  }

  const { error: expertProfileError } = await admin
    .from(EXPERT_PROFILES_TABLE)
    .insert({
      profile_id: profileId,
      display_name: pending.name.trim(),
      title: pending.title.trim(),
      tradition: pending.tradition.trim(),
      experience_years: Math.max(0, pending.experienceYears ?? 0),
      about_text: pending.aboutText?.trim() ?? "",
      approval_status: EXPERT_APPROVAL_PENDING,
      is_published: false,
    });

  if (expertProfileError) {
    return { ok: false, error: "Uzman başvuru profili oluşturulamadı." };
  }

  const nfcCardUuid = await ensureExpertVirtualCard(admin, profileId, expertCode);
  if (!nfcCardUuid) {
    return { ok: false, error: "Uzman oturum kartı oluşturulamadı." };
  }

  return { ok: true, profileId, expertCode };
}

function pendingEmailMatchesAuthUser(
  pendingEmail: string,
  authEmail: string | null
): boolean {
  if (!authEmail) {
    return false;
  }

  return normalizeExpertEmail(pendingEmail) === normalizeExpertEmail(authEmail);
}

export async function finalizeExpertEmailAuth(authUserId: string): Promise<
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; redirectTo: string }
> {
  const pending = await getExpertPendingCookie();
  const failRedirect = EXPERT_LOGIN_PATH;
  const authEmail = await getAuthUserEmail(authUserId);

  if (pending?.mode === "register") {
    if (!pendingEmailMatchesAuthUser(pending.email, authEmail)) {
      await clearExpertPendingCookie();
      return {
        ok: false,
        error: "E-posta doğrulaması eşleşmedi. Lütfen tekrar deneyin.",
        redirectTo: failRedirect,
      };
    }

    const existingExpert = await findExpertProfileByAuthUserId(authUserId);
    if (existingExpert?.expert_code) {
      await clearExpertPendingCookie();
      const session = await establishExpertNfcSession(
        existingExpert.id,
        existingExpert.expert_code
      );

      if (!session.ok) {
        return { ok: false, error: session.error, redirectTo: failRedirect };
      }

      return { ok: true, redirectTo: "/dashboard" };
    }

    const created = await createExpertProfileFromPending(authUserId, pending);
    await clearExpertPendingCookie();

    if (!created.ok) {
      return { ok: false, error: created.error, redirectTo: failRedirect };
    }

    const session = await establishExpertNfcSession(
      created.profileId,
      created.expertCode
    );

    if (!session.ok) {
      return { ok: false, error: session.error, redirectTo: failRedirect };
    }

    return { ok: true, redirectTo: "/dashboard" };
  }

  if (pending?.mode === "login") {
    if (!pendingEmailMatchesAuthUser(pending.email, authEmail)) {
      await clearExpertPendingCookie();
      return {
        ok: false,
        error: "E-posta doğrulaması eşleşmedi. Lütfen tekrar deneyin.",
        redirectTo: failRedirect,
      };
    }
  }

  await clearExpertPendingCookie();

  const expert = await findExpertProfileByAuthUserId(authUserId);
  if (!expert?.expert_code) {
    return {
      ok: false,
      error: "Uzman hesabı bulunamadı veya yetkiniz yok.",
      redirectTo: failRedirect,
    };
  }

  if (expert.is_active === false) {
    return {
      ok: false,
      error: "Hesabınız askıya alınmıştır.",
      redirectTo: failRedirect,
    };
  }

  const session = await establishExpertNfcSession(expert.id, expert.expert_code);
  if (!session.ok) {
    return { ok: false, error: session.error, redirectTo: failRedirect };
  }

  return { ok: true, redirectTo: "/dashboard" };
}
