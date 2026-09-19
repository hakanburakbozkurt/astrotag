import "server-only";

import { randomInt, randomUUID } from "crypto";
import { assertAccountLoginAllowed } from "@/lib/nfc/account-status.server";
import { expertNfcSlugForCode } from "@/lib/expert/expert-codes.shared";
import {
  EXPERT_APPROVAL_APPROVED,
  EXPERT_APPROVAL_PENDING,
  EXPERT_APPROVAL_REJECTED,
} from "@/lib/expert/expert-approval.shared";
import { validatePasswordPair } from "@/lib/auth/password-rules";
import { authErrorMessage } from "@/lib/auth/nfc-auth-debug";
import { isUserAlreadyExistsError } from "@/lib/auth/nfc-auth-errors";
import {
  deleteAuthUser,
  findAuthUserIdByEmail,
  getAuthUserEmail,
  isValidExpertEmail,
  normalizeExpertEmail,
  updateAuthUserPassword,
} from "@/lib/expert/expert-auth-email.server";
import type { ExpertRegisterDraft } from "@/lib/expert/expert-pending-cookie.server";
import {
  clearExpertPendingCookie,
  getExpertPendingCookie,
  setExpertPendingCookie,
  type ExpertPendingPayload,
} from "@/lib/expert/expert-pending-cookie.server";
import { EXPERT_AUTH_CALLBACK_PATH, EXPERT_LOGIN_PATH } from "@/lib/expert/expert-paths";
import { SITE_URL } from "@/lib/nfc/constants";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";
import { STARTING_STAR_POINTS } from "@/lib/constants/cosmic";
import { generateReferralCode } from "@/lib/referral";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { authEmailExists } from "@/lib/auth/auth-email-exists.server";

const PROFILES_TABLE = "profiles";
const EXPERT_PROFILES_TABLE = "expert_profiles";
const PLACEHOLDER_BIRTH_DATE = "1970-01-01";

export type ExpertAuthError = { ok: false; error: string };

export type ExpertRegisterApplicationInput = ExpertRegisterDraft & {
  email: string;
  password: string;
  confirmPassword: string;
};

export type ExpertRegisterErrorCode =
  | "login_required"
  | "validation"
  | "auth"
  | "server";

export type ExpertRegisterApplicationResult =
  | {
      ok: true;
      message: string;
      redirectTo: string;
      requiresEmailConfirmation?: boolean;
    }
  | {
      ok: false;
      error: string;
      redirectTo?: string;
      errorCode?: ExpertRegisterErrorCode;
    };

type ExpertRegistrationSnapshot = {
  authUserId: string;
  profileId: string | null;
  expertProfileId: string | null;
  userRole: string | null;
  isActive: boolean | null;
  deletedAt: string | null;
  approvalStatus: string | null;
  expertCode: string | null;
};

type ExpertRegistrationIntent =
  | "new"
  | "active_approved"
  | "reapply"
  | "non_expert";

const EXPERT_ALREADY_REGISTERED_MESSAGE =
  "Bu e-posta ile zaten bir hesap var, lütfen giriş yapın.";

function mapExpertRegisterAuthError(error: unknown, fallback: string): string {
  const message = authErrorMessage(error, fallback).toLowerCase();

  if (message.includes("password") && message.includes("weak")) {
    return "Şifre çok zayıf. En az 8 karakter ve daha güçlü bir kombinasyon deneyin.";
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
  }

  if (message.includes("invalid") && message.includes("email")) {
    return "Geçerli bir e-posta adresi girin.";
  }

  if (message.includes("signup") && message.includes("disabled")) {
    return "Yeni kayıt şu an kapalı. Lütfen daha sonra tekrar deneyin.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.";
  }

  const original = authErrorMessage(error, fallback);
  if (original !== fallback) {
    return original;
  }

  return fallback;
}

function resolveExpertRegistrationIntent(
  snapshot: ExpertRegistrationSnapshot | null
): ExpertRegistrationIntent {
  if (!snapshot) {
    return "new";
  }

  if (!snapshot.profileId) {
    return "reapply";
  }

  const isDeleted = Boolean(snapshot.deletedAt);
  const isSuspended = snapshot.isActive === false;
  const isExpert = snapshot.userRole === "expert";
  const approvalStatus = snapshot.approvalStatus;

  if (!isExpert && !isDeleted) {
    return "non_expert";
  }

  if (
    approvalStatus === EXPERT_APPROVAL_APPROVED &&
    !isDeleted &&
    !isSuspended
  ) {
    return "active_approved";
  }

  if (
    isDeleted ||
    isSuspended ||
    approvalStatus === EXPERT_APPROVAL_REJECTED ||
    approvalStatus === EXPERT_APPROVAL_PENDING ||
    !approvalStatus
  ) {
    return "reapply";
  }

  return "active_approved";
}

async function loadExpertRegistrationByEmail(
  email: string
): Promise<ExpertRegistrationSnapshot | null> {
  const authUserId = await findAuthUserIdByEmail(email);
  if (!authUserId) {
    return null;
  }

  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from(PROFILES_TABLE)
    .select("id, user_role, is_active, deleted_at, expert_code")
    .eq("user_id", authUserId)
    .maybeSingle();

  if (!profile?.id) {
    return {
      authUserId,
      profileId: null,
      expertProfileId: null,
      userRole: null,
      isActive: null,
      deletedAt: null,
      approvalStatus: null,
      expertCode: null,
    };
  }

  const { data: expertProfile } = await admin
    .from(EXPERT_PROFILES_TABLE)
    .select("id, approval_status")
    .eq("profile_id", profile.id)
    .maybeSingle();

  return {
    authUserId,
    profileId: profile.id,
    expertProfileId: expertProfile?.id ?? null,
    userRole: profile.user_role ?? null,
    isActive: profile.is_active ?? null,
    deletedAt: profile.deleted_at ?? null,
    approvalStatus: expertProfile?.approval_status ?? null,
    expertCode: profile.expert_code ?? null,
  };
}

async function signInExpertAfterRegistration(
  email: string,
  password: string
): Promise<
  | { ok: true; hasSession: true }
  | { ok: true; hasSession: false }
  | { ok: false; error: string }
> {
  const supabase = await createServerSupabaseClient();
  const signIn = await supabase.auth.signInWithPassword({ email, password });

  if (signIn.error) {
    return {
      ok: false,
      error: mapExpertRegisterAuthError(
        signIn.error,
        "Hesabınız oluşturuldu ancak oturum açılamadı. Giriş sayfasından devam edin."
      ),
    };
  }

  return { ok: true, hasSession: Boolean(signIn.data.session) };
}

function buildRegisterSuccessResult(input: {
  message: string;
  redirectTo: string;
  hasSession: boolean;
}): ExpertRegisterApplicationResult {
  if (input.hasSession) {
    return {
      ok: true,
      message: input.message,
      redirectTo: input.redirectTo,
    };
  }

  return {
    ok: true,
    message: input.message,
    redirectTo: input.redirectTo,
    requiresEmailConfirmation: true,
  };
}

function normalizeExpertRegisterDraft(
  input: ExpertRegisterDraft
): ExpertRegisterDraft {
  return {
    name: input.name.trim(),
    title: input.title.trim(),
    tradition: input.tradition.trim(),
    aboutText: input.aboutText.trim(),
    phoneNumber: input.phoneNumber.trim(),
    socialProfileUrl: input.socialProfileUrl.trim(),
    experienceYears: Math.max(0, Math.floor(input.experienceYears)),
  };
}

function validateExpertRegisterDraft(
  input: ExpertRegisterDraft
): ExpertAuthError | { ok: true; draft: ExpertRegisterDraft } {
  const draft = normalizeExpertRegisterDraft(input);

  if (draft.name.length < 2) {
    return { ok: false, error: "Adınız en az 2 karakter olmalıdır." };
  }

  if (draft.title.length < 2) {
    return { ok: false, error: "Unvan en az 2 karakter olmalıdır." };
  }

  if (draft.tradition.length < 2) {
    return { ok: false, error: "Uzmanlık alanı seçin veya girin." };
  }

  if (draft.phoneNumber.length < 10) {
    return { ok: false, error: "Geçerli bir telefon numarası girin." };
  }

  if (draft.socialProfileUrl.length < 4) {
    return { ok: false, error: "Sosyal medya profil bağlantısı girin." };
  }

  return { ok: true, draft };
}

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

async function establishExpertSession(
  profileId: string,
  expertCode: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createServiceRoleClient();
  const slug = expertNfcSlugForCode(expertCode);
  const nfcCardUuid = await ensureExpertVirtualCard(admin, profileId, expertCode);

  if (!nfcCardUuid) {
    return { ok: false, error: "Uzman profili hazırlanamadı." };
  }

  try {
    await assertAccountLoginAllowed({
      profileId,
      nfcCardUuid,
      uniqueId: slug,
    });
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

export async function sendExpertRegisterMagicLink(
  input: ExpertRegisterDraft & { email: string }
): Promise<{ ok: true } | ExpertAuthError> {
  const email = normalizeExpertEmail(input.email);

  if (!isValidExpertEmail(email)) {
    return { ok: false, error: "Geçerli bir e-posta adresi girin." };
  }

  const draftValidation = validateExpertRegisterDraft(input);
  if (!draftValidation.ok) {
    return draftValidation;
  }

  const { draft } = draftValidation;

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
    ...draft,
  });

  return { ok: true };
}

async function upsertExpertProfileFromDraft(
  snapshot: ExpertRegistrationSnapshot,
  draft: ExpertRegisterDraft
): Promise<
  | { ok: true; profileId: string; expertCode: string }
  | { ok: false; error: string }
> {
  const normalizedDraft = normalizeExpertRegisterDraft(draft);
  const admin = createServiceRoleClient();

  if (!snapshot.profileId) {
    return createExpertProfileFromDraft(snapshot.authUserId, normalizedDraft);
  }

  const profileId = snapshot.profileId;
  let expertCode = snapshot.expertCode;

  if (!expertCode) {
    expertCode = await generateUniqueExpertCode(admin);
    if (!expertCode) {
      return { ok: false, error: "Uzman kodu oluşturulamadı." };
    }
  }

  const slug = expertNfcSlugForCode(expertCode);
  const { error: profileError } = await admin
    .from(PROFILES_TABLE)
    .update({
      name: normalizedDraft.name,
      user_role: "expert",
      is_active: true,
      deleted_at: null,
      anonymized_at: null,
      expert_code: expertCode,
      nfc_uid: slug,
    })
    .eq("id", profileId);

  if (profileError) {
    return { ok: false, error: "Uzman hesabı güncellenemedi." };
  }

  const expertProfilePayload = {
    display_name: normalizedDraft.name,
    title: normalizedDraft.title,
    tradition: normalizedDraft.tradition,
    experience_years: normalizedDraft.experienceYears,
    about_text: normalizedDraft.aboutText,
    phone_number: normalizedDraft.phoneNumber,
    social_profile_url: normalizedDraft.socialProfileUrl,
    approval_status: EXPERT_APPROVAL_PENDING,
    is_published: false,
    updated_at: new Date().toISOString(),
  };

  if (snapshot.expertProfileId) {
    const { error: expertUpdateError } = await admin
      .from(EXPERT_PROFILES_TABLE)
      .update(expertProfilePayload)
      .eq("id", snapshot.expertProfileId);

    if (expertUpdateError) {
      return { ok: false, error: "Uzman başvuru profili güncellenemedi." };
    }
  } else {
    const { error: expertInsertError } = await admin
      .from(EXPERT_PROFILES_TABLE)
      .insert({
        profile_id: profileId,
        ...expertProfilePayload,
      });

    if (expertInsertError) {
      return { ok: false, error: "Uzman başvuru profili oluşturulamadı." };
    }
  }

  const nfcCardUuid = await ensureExpertVirtualCard(admin, profileId, expertCode);
  if (!nfcCardUuid) {
    return { ok: false, error: "Uzman oturum kartı hazırlanamadı." };
  }

  await admin
    .from(NFC_CARD_TABLE)
    .update({ is_active: true })
    .eq("profile_id", profileId);

  return { ok: true, profileId, expertCode };
}

async function reapplyExpertApplication(
  snapshot: ExpertRegistrationSnapshot,
  email: string,
  password: string,
  draft: ExpertRegisterDraft
): Promise<ExpertRegisterApplicationResult> {
  const passwordUpdate = await updateAuthUserPassword(snapshot.authUserId, password);
  if (!passwordUpdate.ok) {
    return {
      ok: false,
      error: mapExpertRegisterAuthError(
        passwordUpdate.error,
        "Şifreniz güncellenemedi. Lütfen tekrar deneyin."
      ),
      errorCode: "auth",
    };
  }

  const upserted = await upsertExpertProfileFromDraft(snapshot, draft);
  if (!upserted.ok) {
    return { ok: false, error: upserted.error, errorCode: "server" };
  }

  const signIn = await signInExpertAfterRegistration(email, password);
  if (!signIn.ok) {
    return {
      ok: true,
      message:
        "Başvurunuz yenilendi. Güncel bilgilerinizle giriş sayfasından oturum açabilirsiniz.",
      redirectTo: EXPERT_LOGIN_PATH,
      requiresEmailConfirmation: true,
    };
  }

  if (signIn.hasSession) {
    const session = await establishExpertSession(upserted.profileId, upserted.expertCode);
    if (!session.ok) {
      return {
        ok: false,
        error: session.error,
        redirectTo: EXPERT_LOGIN_PATH,
        errorCode: "auth",
      };
    }

    return buildRegisterSuccessResult({
      message:
        "Başvurunuz yenilendi ve tekrar incelemeye alındı. Admin onayından sonra vitrinde yerinizi alabilirsiniz.",
      redirectTo: "/dashboard",
      hasSession: true,
    });
  }

  return buildRegisterSuccessResult({
    message:
      "Başvurunuz yenilendi. E-postanızı doğruladıktan sonra giriş yapabilirsiniz.",
    redirectTo: EXPERT_LOGIN_PATH,
    hasSession: false,
  });
}

async function handleExistingExpertRegistration(
  email: string,
  password: string,
  draft: ExpertRegisterDraft
): Promise<ExpertRegisterApplicationResult | null> {
  const snapshot = await loadExpertRegistrationByEmail(email);
  const intent = resolveExpertRegistrationIntent(snapshot);

  if (intent === "new") {
    return null;
  }

  if (intent === "active_approved") {
    return {
      ok: false,
      error: EXPERT_ALREADY_REGISTERED_MESSAGE,
      redirectTo: EXPERT_LOGIN_PATH,
      errorCode: "login_required",
    };
  }

  if (intent === "non_expert") {
    return {
      ok: false,
      error: EXPERT_ALREADY_REGISTERED_MESSAGE,
      redirectTo: EXPERT_LOGIN_PATH,
      errorCode: "login_required",
    };
  }

  if (!snapshot) {
    return {
      ok: false,
      error: "Mevcut hesap doğrulanamadı. Lütfen tekrar deneyin.",
      errorCode: "server",
    };
  }

  return reapplyExpertApplication(snapshot, email, password, draft);
}

export async function registerExpertApplication(
  input: ExpertRegisterApplicationInput
): Promise<ExpertRegisterApplicationResult> {
  const email = normalizeExpertEmail(input.email);

  if (!isValidExpertEmail(email)) {
    return {
      ok: false,
      error: "Geçerli bir e-posta adresi girin.",
      errorCode: "validation",
    };
  }

  const passwordError = validatePasswordPair(input.password, input.confirmPassword);
  if (passwordError) {
    return { ok: false, error: passwordError, errorCode: "validation" };
  }

  const draftValidation = validateExpertRegisterDraft(input);
  if (!draftValidation.ok) {
    return { ...draftValidation, errorCode: "validation" };
  }

  const { draft } = draftValidation;

  const existingRegistration = await handleExistingExpertRegistration(
    email,
    input.password,
    draft
  );
  if (existingRegistration) {
    return existingRegistration;
  }

  const supabase = await createServerSupabaseClient();
  const signUp = await supabase.auth.signUp({
    email,
    password: input.password,
  });

  if (signUp.error) {
    if (isUserAlreadyExistsError(signUp.error)) {
      const retryExisting = await handleExistingExpertRegistration(
        email,
        input.password,
        draft
      );

      if (retryExisting) {
        return retryExisting;
      }

      return {
        ok: false,
        error: EXPERT_ALREADY_REGISTERED_MESSAGE,
        redirectTo: EXPERT_LOGIN_PATH,
        errorCode: "login_required",
      };
    }

    return {
      ok: false,
      error: mapExpertRegisterAuthError(signUp.error, "Uzman hesabı oluşturulamadı."),
      errorCode: "auth",
    };
  }

  const authUserId = signUp.data.user?.id;
  if (!authUserId) {
    return {
      ok: false,
      error: "Kullanıcı hesabı oluşturulamadı.",
      errorCode: "server",
    };
  }

  const created = await createExpertProfileFromDraft(authUserId, draft);
  if (!created.ok) {
    await deleteAuthUser(authUserId);
    return { ok: false, error: created.error, errorCode: "server" };
  }

  const hasSession = Boolean(signUp.data.session);

  if (hasSession) {
    const session = await establishExpertSession(created.profileId, created.expertCode);
    if (!session.ok) {
      return {
        ok: false,
        error: session.error,
        redirectTo: EXPERT_LOGIN_PATH,
        errorCode: "auth",
      };
    }

    return buildRegisterSuccessResult({
      message:
        "Başvurunuz alındı. Admin onayından sonra vitrinde yerinizi alabilirsiniz.",
      redirectTo: "/dashboard",
      hasSession: true,
    });
  }

  return buildRegisterSuccessResult({
    message:
      "Başvurunuz kaydedildi. E-postanızdaki doğrulama bağlantısını onayladıktan sonra giriş yapabilirsiniz.",
    redirectTo: EXPERT_LOGIN_PATH,
    hasSession: false,
  });
}

async function createExpertProfileFromDraft(
  authUserId: string,
  draft: ExpertRegisterDraft
): Promise<
  | { ok: true; profileId: string; expertCode: string }
  | { ok: false; error: string }
> {
  const normalizedDraft = normalizeExpertRegisterDraft(draft);
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
    name: normalizedDraft.name,
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
      display_name: normalizedDraft.name,
      title: normalizedDraft.title,
      tradition: normalizedDraft.tradition,
      experience_years: normalizedDraft.experienceYears,
      about_text: normalizedDraft.aboutText,
      phone_number: normalizedDraft.phoneNumber,
      social_profile_url: normalizedDraft.socialProfileUrl,
      approval_status: EXPERT_APPROVAL_PENDING,
      is_published: false,
    });

  if (expertProfileError) {
    await admin.from(PROFILES_TABLE).delete().eq("id", profileId);
    return { ok: false, error: "Uzman başvuru profili oluşturulamadı." };
  }

  const nfcCardUuid = await ensureExpertVirtualCard(admin, profileId, expertCode);
  if (!nfcCardUuid) {
    await admin.from(EXPERT_PROFILES_TABLE).delete().eq("profile_id", profileId);
    await admin.from(PROFILES_TABLE).delete().eq("id", profileId);
    return { ok: false, error: "Uzman oturum kartı oluşturulamadı." };
  }

  return { ok: true, profileId, expertCode };
}

async function createExpertProfileFromPending(
  authUserId: string,
  pending: Extract<ExpertPendingPayload, { mode: "register" }>
): Promise<
  | { ok: true; profileId: string; expertCode: string }
  | { ok: false; error: string }
> {
  return createExpertProfileFromDraft(authUserId, pending);
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
      const session = await establishExpertSession(
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

    const session = await establishExpertSession(
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

  const session = await establishExpertSession(expert.id, expert.expert_code);
  if (!session.ok) {
    return { ok: false, error: session.error, redirectTo: failRedirect };
  }

  return { ok: true, redirectTo: "/dashboard" };
}
