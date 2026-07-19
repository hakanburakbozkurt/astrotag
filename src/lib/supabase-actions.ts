"use server";

import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  getProtectedNfcAccess,
  ProtectedNfcAccessError,
  requireProtectedNfcAccess,
} from "@/lib/nfc/protected-access.server";
import {
  SupabaseActionError,
  formatCountdown,
} from "@/lib/supabase-action-error";
import type {
  HoraryQuestion,
  HoraryQuestionInsert,
  Session,
  SessionInsert,
} from "@/types/database";
import type { BondAdditionalInput, PartnerProfileInput, UserData } from "@/types/user";
import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import { resolveBirthPlaceSafe } from "@/lib/astrology/geocode";
import {
  normalizeDateForInput,
  normalizeTimeForInput,
  partnerFormFromRow,
  type PartnerFormValues,
} from "@/lib/partner-profile";
import {
  REFERRAL_STAR_POINTS_BONUS,
  SESSION_DURATION_HOURS,
  STAR_POINTS_COST_PER_ACTION,
  STAR_POINTS_PER_CHARGE,
  MAX_STAR_POINTS,
  TAROT_STAR_POINTS_COST,
} from "@/lib/constants/cosmic";
import { buildCardSignature } from "@/lib/tarot/deck";
import {
  buildStarPointsChargeState,
  deductStarPointsBalance,
  type StarPointsChargeState,
} from "@/lib/energy-charge";
import {
  generateReferralCode,
  isValidReferralCodeFormat,
  normalizeReferralCode,
} from "@/lib/referral";

const SESSIONS_TABLE = "sessions";
const HORARY_QUESTIONS_TABLE = "horary_questions";
const PROFILE_TABLE = "profiles";
const REFERRALS_TABLE = "referrals";
const TAROT_HISTORY_TABLE = "tarot_history";

export interface ReferralInfo {
  referralCode: string;
  starPointsBonus: number;
  starPoints: number;
  totalStarPoints: number;
  hasUsedReferral: boolean;
}

export async function getAuthUserId(): Promise<string | null> {
  const access = await getProtectedNfcAccess();
  return access?.profileId ?? null;
}

export async function requireAuthUserId(): Promise<string> {
  try {
    const access = await requireProtectedNfcAccess();
    return access.profileId;
  } catch (error) {
    if (error instanceof ProtectedNfcAccessError) {
      throw new SupabaseActionError(
        "Oturum Sona Erdi veya Geçersiz Erişim"
      );
    }

    throw error;
  }
}

function getServiceClient() {
  return createServiceRoleClient();
}

function mapSupabaseError(error: { message: string } | null, fallback: string): never {
  throw new SupabaseActionError(error?.message ?? fallback);
}

export async function getUserProfile(): Promise<UserData | null> {
  try {
    const access = await getProtectedNfcAccess();

    if (!access?.profileId) {
      console.warn("[getUserProfile] NFC oturumu yok veya geçersiz");
      return null;
    }

    const userId = access.profileId;
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(PROFILE_TABLE)
      .select(
        "name, birth_date, birth_time, birth_place, relationship_status, star_points, star_points_bonus, referral_code, partner_name, partner_birth_date, partner_birth_time, partner_birth_place, partner_meeting_date"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[getUserProfile] profiles sorgu hatası", {
        profileId: userId,
        message: error.message,
        code: error.code,
      });
      return null;
    }

    if (!data) {
      console.warn("[getUserProfile] Profil satırı yok", { profileId: userId });
      return null;
    }

    const name = data.name?.trim() ?? "";

    if (!name) {
      console.log("[getUserProfile] Profil adı boş — kayıt tamamlanmamış", {
        profileId: userId,
      });
      return null;
    }

    return {
      name,
      birthDate: data.birth_date ?? "",
      birthTime: data.birth_time ?? "00:00:00",
      birthPlace: data.birth_place ?? "",
      relationshipStatus: data.relationship_status ?? "İlişki Yok",
      starPoints: data.star_points ?? 0,
      starPointsBonus: data.star_points_bonus ?? 0,
      referralCode: data.referral_code,
      partnerName: data.partner_name,
      partnerBirthDate: normalizeDateForInput(data.partner_birth_date),
      partnerBirthTime: normalizeTimeForInput(data.partner_birth_time),
      partnerBirthPlace: data.partner_birth_place,
      partnerMeetingDate: normalizeDateForInput(data.partner_meeting_date),
    };
  } catch (error) {
    console.error("[getUserProfile] Beklenmeyen hata", error);
    return null;
  }
}

export async function getActiveSession(): Promise<Session | null> {
  try {
    const userId = await requireAuthUserId();
    const supabase = getServiceClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", now)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      mapSupabaseError(error, "Aktif oturum alınamadı.");
    }

    return (data as Session | null) ?? null;
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Aktif oturum sorgulanırken bir hata oluştu.");
  }
}

export async function createSession(
  durationHours = SESSION_DURATION_HOURS
): Promise<Session> {
  try {
    const userId = await requireAuthUserId();
    const supabase = getServiceClient();
    const expiresAt = new Date(
      Date.now() + durationHours * 60 * 60 * 1000
    ).toISOString();

    const payload: SessionInsert = {
      user_id: userId,
      expires_at: expiresAt,
    };

    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      mapSupabaseError(error, "Yeni oturum oluşturulamadı.");
    }

    return data as Session;
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Enerji yüklenirken bir hata oluştu.");
  }
}

export async function getStarPoints(): Promise<number> {
  const state = await getStarPointsChargeState();
  return state.totalStarPoints;
}

export async function getStarPointsChargeState(): Promise<StarPointsChargeState> {
  try {
    const userId = await requireAuthUserId();
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(PROFILE_TABLE)
      .select("star_points, star_points_bonus, last_star_points_charge")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      mapSupabaseError(error, "Yıldız puanı bilgisi alınamadı.");
    }

    return buildStarPointsChargeState(
      data?.star_points ?? 0,
      data?.star_points_bonus ?? 0,
      data?.last_star_points_charge ?? null
    );
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Yıldız puanı okunurken bir hata oluştu.");
  }
}

/** @deprecated Use getStarPoints */
export const getCosmicEnergy = getStarPoints;

/** @deprecated Use getStarPointsChargeState */
export const getEnergyChargeState = getStarPointsChargeState;

async function ensureReferralCode(userId: string): Promise<string> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    mapSupabaseError(error, "Referans kodu alınamadı.");
  }

  if (data?.referral_code?.trim()) {
    return data.referral_code.trim();
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateReferralCode();
    const { error: updateError } = await supabase
      .from(PROFILE_TABLE)
      .update({ referral_code: candidate })
      .eq("id", userId)
      .is("referral_code", null);

    if (!updateError) {
      return candidate;
    }
  }

  throw new SupabaseActionError("Referans kodu oluşturulamadı.");
}

export async function getReferralInfo(): Promise<ReferralInfo> {
  try {
    const userId = await requireAuthUserId();
    const supabase = getServiceClient();
    const referralCode = await ensureReferralCode(userId);

    const [{ data: profile, error: profileError }, { data: referralUse, error: referralError }] =
      await Promise.all([
        supabase
          .from(PROFILE_TABLE)
          .select("star_points, star_points_bonus")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from(REFERRALS_TABLE)
          .select("id")
          .eq("referred_id", userId)
          .maybeSingle(),
      ]);

    if (profileError) {
      mapSupabaseError(profileError, "Referans bilgisi alınamadı.");
    }

    if (referralError) {
      mapSupabaseError(referralError, "Referans geçmişi alınamadı.");
    }

    const starPoints = profile?.star_points ?? 0;
    const starPointsBonus = profile?.star_points_bonus ?? 0;

    return {
      referralCode,
      starPoints,
      starPointsBonus,
      totalStarPoints: starPoints + starPointsBonus,
      hasUsedReferral: Boolean(referralUse),
    };
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Referans bilgisi okunurken hata oluştu.");
  }
}

export async function applyReferralCode(rawCode: string): Promise<ReferralInfo> {
  try {
    const userId = await requireAuthUserId();
    const supabase = getServiceClient();
    const normalized = normalizeReferralCode(rawCode);

    if (!isValidReferralCodeFormat(normalized)) {
      throw new SupabaseActionError("Geçersiz referans kodu formatı.");
    }

    const { data: existingUse, error: existingError } = await supabase
      .from(REFERRALS_TABLE)
      .select("id")
      .eq("referred_id", userId)
      .maybeSingle();

    if (existingError) {
      mapSupabaseError(existingError, "Referans geçmişi kontrol edilemedi.");
    }

    if (existingUse) {
      throw new SupabaseActionError("Zaten bir referans kodu kullandınız.");
    }

    const { data: referrerProfile, error: referrerError } = await supabase
      .from(PROFILE_TABLE)
      .select("id, star_points_bonus")
      .eq("referral_code", normalized)
      .maybeSingle();

    if (referrerError) {
      mapSupabaseError(referrerError, "Referans kodu doğrulanamadı.");
    }

    if (!referrerProfile?.id) {
      throw new SupabaseActionError("Referans kodu bulunamadı.");
    }

    if (referrerProfile.id === userId) {
      throw new SupabaseActionError("Kendi referans kodunuzu kullanamazsınız.");
    }

    const { error: insertError } = await supabase.from(REFERRALS_TABLE).insert({
      referrer_id: referrerProfile.id,
      referred_id: userId,
    });

    if (insertError) {
      mapSupabaseError(insertError, "Referans kaydı oluşturulamadı.");
    }

    const { data: referredProfile, error: referredError } = await supabase
      .from(PROFILE_TABLE)
      .select("star_points_bonus")
      .eq("id", userId)
      .maybeSingle();

    if (referredError || !referredProfile) {
      mapSupabaseError(referredError, "Bonus yıldız güncellenemedi.");
    }

    const referrerBonus =
      (referrerProfile.star_points_bonus ?? 0) + REFERRAL_STAR_POINTS_BONUS;
    const referredBonus =
      (referredProfile.star_points_bonus ?? 0) + REFERRAL_STAR_POINTS_BONUS;

    const [{ error: referrerUpdateError }, { error: referredUpdateError }] =
      await Promise.all([
        supabase
          .from(PROFILE_TABLE)
          .update({ star_points_bonus: referrerBonus })
          .eq("id", referrerProfile.id),
        supabase
          .from(PROFILE_TABLE)
          .update({ star_points_bonus: referredBonus })
          .eq("id", userId),
      ]);

    if (referrerUpdateError || referredUpdateError) {
      mapSupabaseError(
        referrerUpdateError ?? referredUpdateError,
        "Referans bonusu uygulanamadı."
      );
    }

    return getReferralInfo();
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Referans kodu uygulanırken hata oluştu.");
  }
}

export async function chargeStarPoints(): Promise<{
  starPoints: number;
  session: Session;
  chargeState: StarPointsChargeState;
}> {
  try {
    const userId = await requireAuthUserId();
    const supabase = getServiceClient();
    const currentState = await getStarPointsChargeState();

    if (currentState.isFull) {
      throw new SupabaseActionError("Yıldızlar zaten dolu (100/100).");
    }

    if (!currentState.canCharge && currentState.nextChargeAt) {
      throw new SupabaseActionError(
        `Bir sonraki yıldız yüklemesi için ${formatCountdown(currentState.nextChargeAt)} beklemelisiniz.`
      );
    }

    const nextStarPoints = Math.min(
      currentState.starPoints + STAR_POINTS_PER_CHARGE,
      MAX_STAR_POINTS
    );
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from(PROFILE_TABLE)
      .update({
        star_points: nextStarPoints,
        last_star_points_charge: nowIso,
      })
      .eq("id", userId);

    if (updateError) {
      mapSupabaseError(updateError, "Yıldız puanı güncellenemedi.");
    }

    const session = await createSession(SESSION_DURATION_HOURS);
    const chargeState = buildStarPointsChargeState(
      nextStarPoints,
      currentState.starPointsBonus,
      nowIso
    );

    return { starPoints: nextStarPoints, session, chargeState };
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Yıldız puanı yüklenirken bir hata oluştu.");
  }
}

/** @deprecated Use chargeStarPoints */
export const chargeCosmicEnergy = chargeStarPoints;

export async function consumeStarPoints(
  amount: number = STAR_POINTS_COST_PER_ACTION
): Promise<number> {
  try {
    const userId = await requireAuthUserId();
    const supabase = getServiceClient();

    const { data, error: readError } = await supabase
      .from(PROFILE_TABLE)
      .select("star_points, star_points_bonus")
      .eq("id", userId)
      .maybeSingle();

    if (readError || !data) {
      mapSupabaseError(readError, "Yıldız puanı bilgisi okunamadı.");
    }

    const starPoints = data.star_points ?? 0;
    const starPointsBonus = data.star_points_bonus ?? 0;
    const totalStarPoints = starPoints + starPointsBonus;

    if (amount <= 0) {
      throw new SupabaseActionError("Geçersiz yıldız puanı miktarı.");
    }

    if (totalStarPoints < amount) {
      throw new SupabaseActionError(
        `Bu işlem için ${amount} yıldız gerekir. Mevcut: ${totalStarPoints}`
      );
    }

    const next = deductStarPointsBalance(starPoints, starPointsBonus, amount);

    const { error } = await supabase
      .from(PROFILE_TABLE)
      .update({
        star_points: next.starPoints,
        star_points_bonus: next.starPointsBonus,
      })
      .eq("id", userId);

    if (error) {
      mapSupabaseError(error, "Yıldız puanı harcanamadı.");
    }

    return next.starPoints + next.starPointsBonus;
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Yıldız puanı kontrolü sırasında bir hata oluştu.");
  }
}

/** @deprecated Use consumeStarPoints */
export const consumeCosmicEnergy = consumeStarPoints;

export async function consumeStarPointsForQuestion(): Promise<void> {
  await consumeStarPoints(STAR_POINTS_COST_PER_ACTION);
}

/** @deprecated Use consumeStarPointsForQuestion */
export const consumeCosmicEnergyForQuestion = consumeStarPointsForQuestion;

export async function consumeTarotStarPoints(): Promise<number> {
  if (TAROT_STAR_POINTS_COST <= 0) {
    return getStarPoints();
  }

  return consumeStarPoints(TAROT_STAR_POINTS_COST);
}

/** @deprecated Use consumeTarotStarPoints */
export const consumeTarotEnergy = consumeTarotStarPoints;

export async function getCachedTarotReading(
  userId: string,
  cardIds: string[],
  cacheHours = 24
): Promise<string | null> {
  try {
    const supabase = getServiceClient();
    const signature = buildCardSignature(cardIds);
    const since = new Date(Date.now() - cacheHours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from(TAROT_HISTORY_TABLE)
      .select("reading, created_at")
      .eq("user_id", userId)
      .eq("card_signature", signature)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      mapSupabaseError(error, "Tarot önbelleği okunamadı.");
    }

    return data?.reading?.trim() ?? null;
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Tarot önbelleği sorgulanırken hata oluştu.");
  }
}

export async function saveTarotHistory(input: {
  userId: string;
  question: string;
  cardIds: string[];
  reading: string;
}): Promise<void> {
  try {
    const supabase = getServiceClient();
    const signature = buildCardSignature(input.cardIds);

    const { error } = await supabase.from(TAROT_HISTORY_TABLE).insert({
      user_id: input.userId,
      question: input.question.trim(),
      card_ids: input.cardIds,
      card_signature: signature,
      reading: input.reading.trim(),
    });

    if (error) {
      mapSupabaseError(error, "Tarot yorumu kaydedilemedi.");
    }
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Tarot geçmişi kaydedilirken hata oluştu.");
  }
}

export async function getPartnerProfile(): Promise<PartnerFormValues> {
  try {
    const userId = await requireAuthUserId();
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(PROFILE_TABLE)
      .select(
        "partner_name, partner_birth_date, partner_birth_time, partner_birth_place"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      mapSupabaseError(error, "Partner bilgileri alınamadı.");
    }

    return partnerFormFromRow(data);
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Partner bilgileri okunurken bir hata oluştu.");
  }
}

export async function updatePartnerProfile(
  input: PartnerProfileInput
): Promise<UserData> {
  try {
    const userId = await requireAuthUserId();
    const supabase = getServiceClient();
    const birthPlace = input.partnerBirthPlace.trim();

    const geocode = await resolveBirthPlaceSafe(birthPlace);
    if (!geocode.ok) {
      throw new SupabaseActionError(geocode.message);
    }

    const { error } = await supabase
      .from(PROFILE_TABLE)
      .update({
        partner_name: input.partnerName.trim(),
        partner_birth_date: input.partnerBirthDate,
        partner_birth_time: input.partnerBirthTime,
        partner_birth_place: birthPlace,
      })
      .eq("id", userId);

    if (error) {
      mapSupabaseError(error, "Partner bilgileri kaydedilemedi.");
    }

    const profile = await getUserProfile();
    if (!profile) {
      throw new SupabaseActionError("Profil güncellendikten sonra okunamadı.");
    }

    return profile;
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Partner ayarları kaydedilirken hata oluştu.");
  }
}

export async function updateBondAdditionalInfo(
  input: BondAdditionalInput
): Promise<UserData> {
  try {
    const userId = await requireAuthUserId();
    const supabase = getServiceClient();

    const { error } = await supabase
      .from(PROFILE_TABLE)
      .update({
        relationship_status: input.relationshipStatus.trim() || "İlişkisi Var",
        partner_meeting_date: input.partnerMeetingDate.trim() || null,
      })
      .eq("id", userId);

    if (error) {
      mapSupabaseError(error, "Astro-Bağ bilgileri kaydedilemedi.");
    }

    const profile = await getUserProfile();
    if (!profile) {
      throw new SupabaseActionError("Profil güncellendikten sonra okunamadı.");
    }

    return profile;
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Astro-Bağ bilgileri kaydedilirken hata oluştu.");
  }
}

export async function insertHoraryQuestion(question: string): Promise<HoraryQuestion> {
  const { submitHoraryQuestion } = await import("@/lib/submit-question");
  return submitHoraryQuestion(question);
}

export async function updateHoraryAnswer(
  id: string,
  aiAnswer: string,
  planetPositions?: CosmicAnalysisContext | Record<string, unknown> | null
): Promise<HoraryQuestion> {
  try {
    const trimmed = aiAnswer.trim();
    if (!id?.trim() || !trimmed) {
      throw new SupabaseActionError("Cevap güncellenemedi.");
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(HORARY_QUESTIONS_TABLE)
      .update({
        ai_answer: trimmed,
        ...(planetPositions ? { planet_positions: planetPositions } : {}),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      mapSupabaseError(error, "Cevap kaydedilemedi.");
    }

    return data as HoraryQuestion;
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Cevap güncellenirken bir hata oluştu.");
  }
}

export async function getHoraryQuestion(id: string): Promise<HoraryQuestion | null> {
  try {
    if (!id?.trim()) {
      throw new SupabaseActionError("Geçersiz soru kimliği.");
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(HORARY_QUESTIONS_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      mapSupabaseError(error, "Soru getirilemedi.");
    }

    return (data as HoraryQuestion | null) ?? null;
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Soru okunurken bir hata oluştu.");
  }
}

export async function waitForHoraryAnswer(
  id: string,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<HoraryQuestion> {
  const maxAttempts = options?.maxAttempts ?? 20;
  const intervalMs = options?.intervalMs ?? 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const record = await getHoraryQuestion(id);

    if (record?.ai_answer?.trim()) {
      return record;
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new SupabaseActionError(
    "Yıldızlar henüz cevap vermedi. Lütfen tekrar deneyin."
  );
}
