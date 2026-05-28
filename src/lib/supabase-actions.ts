import { supabase } from "@/lib/supabase";
import {
  getDevTestUserId,
  isDevAuthBypassActive,
} from "@/lib/dev-mode";
import type {
  HoraryQuestion,
  HoraryQuestionInsert,
  Session,
  SessionInsert,
} from "@/types/database";
import type { PartnerProfileInput, UserData } from "@/types/user";
import type { CosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import {
  normalizeDateForInput,
  normalizeTimeForInput,
  partnerFormFromRow,
  type PartnerFormValues,
} from "@/lib/partner-profile";
import {
  ENERGY_COST_PER_ACTION,
  ENERGY_PER_CHARGE,
  MAX_COSMIC_ENERGY,
  REFERRAL_ENERGY_BONUS,
  SESSION_DURATION_HOURS,
  STARTING_ENERGY,
  TAROT_ENERGY_COST,
} from "@/lib/constants/cosmic";
import { buildCardSignature } from "@/lib/tarot/deck";
import {
  buildEnergyChargeState,
  deductEnergyBalance,
  type EnergyChargeState,
} from "@/lib/energy-charge";
import {
  generateReferralCode,
  isValidReferralCodeFormat,
  normalizeReferralCode,
} from "@/lib/referral";

export const LOGIN_PATH = "/login";

export class SupabaseActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseActionError";
  }
}

const SESSIONS_TABLE = "sessions";
const HORARY_QUESTIONS_TABLE = "horary_questions";
const PROFILE_TABLE = "profiles";
const REFERRALS_TABLE = "referrals";
const TAROT_HISTORY_TABLE = "tarot_history";

export interface ReferralInfo {
  referralCode: string;
  energyBonus: number;
  cosmicEnergy: number;
  totalEnergy: number;
  hasUsedReferral: boolean;
}

export function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    window.location.href = LOGIN_PATH;
  }
}

export async function getAuthUserId(): Promise<string | null> {
  if (isDevAuthBypassActive()) {
    return getDevTestUserId();
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return null;
  }

  return user.id;
}

export async function requireAuthUserId(): Promise<string> {
  if (isDevAuthBypassActive()) {
    return getDevTestUserId();
  }

  const userId = await getAuthUserId();

  if (!userId) {
    redirectToLogin();
    throw new SupabaseActionError("Oturum bulunamadı. Giriş sayfasına yönlendiriliyorsunuz.");
  }

  return userId;
}

function mapSupabaseError(error: { message: string } | null, fallback: string): never {
  throw new SupabaseActionError(error?.message ?? fallback);
}

export async function getUserProfile(): Promise<UserData | null> {
  try {
    const userId = await requireAuthUserId();

    const { data, error } = await supabase
      .from(PROFILE_TABLE)
      .select(
        "name, birth_date, birth_time, birth_place, relationship_status, cosmic_energy, energy_bonus, referral_code, partner_name, partner_birth_date, partner_birth_time, partner_birth_place"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      mapSupabaseError(error, "Profil alınamadı.");
    }

    if (!data) {
      return null;
    }

    return {
      name: data.name,
      birthDate: data.birth_date,
      birthTime: data.birth_time,
      birthPlace: data.birth_place ?? "",
      relationshipStatus: data.relationship_status ?? "İlişki Yok",
      cosmicEnergy: data.cosmic_energy ?? 0,
      energyBonus: data.energy_bonus ?? 0,
      referralCode: data.referral_code,
      partnerName: data.partner_name,
      partnerBirthDate: normalizeDateForInput(data.partner_birth_date),
      partnerBirthTime: normalizeTimeForInput(data.partner_birth_time),
      partnerBirthPlace: data.partner_birth_place,
    };
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Profil okunurken bir hata oluştu.");
  }
}

export async function getActiveSession(): Promise<Session | null> {
  try {
    const userId = await requireAuthUserId();
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

export async function getCosmicEnergy(): Promise<number> {
  const state = await getEnergyChargeState();
  return state.totalEnergy;
}

export async function getEnergyChargeState(): Promise<EnergyChargeState> {
  try {
    const userId = await requireAuthUserId();
    const { data, error } = await supabase
      .from(PROFILE_TABLE)
      .select("cosmic_energy, energy_bonus, last_energy_charge")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      mapSupabaseError(error, "Enerji bilgisi alınamadı.");
    }

    return buildEnergyChargeState(
      data?.cosmic_energy ?? 0,
      data?.energy_bonus ?? 0,
      data?.last_energy_charge ?? null
    );
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Enerji okunurken bir hata oluştu.");
  }
}

async function ensureReferralCode(userId: string): Promise<string> {
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
    const referralCode = await ensureReferralCode(userId);

    const [{ data: profile, error: profileError }, { data: referralUse, error: referralError }] =
      await Promise.all([
        supabase
          .from(PROFILE_TABLE)
          .select("cosmic_energy, energy_bonus")
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

    const cosmicEnergy = profile?.cosmic_energy ?? 0;
    const energyBonus = profile?.energy_bonus ?? 0;

    return {
      referralCode,
      cosmicEnergy,
      energyBonus,
      totalEnergy: cosmicEnergy + energyBonus,
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
      .select("id, energy_bonus")
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
      .select("energy_bonus")
      .eq("id", userId)
      .maybeSingle();

    if (referredError || !referredProfile) {
      mapSupabaseError(referredError, "Bonus enerji güncellenemedi.");
    }

    const referrerBonus = (referrerProfile.energy_bonus ?? 0) + REFERRAL_ENERGY_BONUS;
    const referredBonus = (referredProfile.energy_bonus ?? 0) + REFERRAL_ENERGY_BONUS;

    const [{ error: referrerUpdateError }, { error: referredUpdateError }] =
      await Promise.all([
        supabase
          .from(PROFILE_TABLE)
          .update({ energy_bonus: referrerBonus })
          .eq("id", referrerProfile.id),
        supabase
          .from(PROFILE_TABLE)
          .update({ energy_bonus: referredBonus })
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

export async function chargeCosmicEnergy(): Promise<{
  energy: number;
  session: Session;
  chargeState: EnergyChargeState;
}> {
  try {
    const userId = await requireAuthUserId();
    const currentState = await getEnergyChargeState();

    if (currentState.isFull) {
      throw new SupabaseActionError("Enerji zaten dolu (100/100).");
    }

    if (!currentState.canCharge && currentState.nextChargeAt) {
      throw new SupabaseActionError(
        `Bir sonraki enerji yüklemesi için ${formatCountdown(currentState.nextChargeAt)} beklemelisiniz.`
      );
    }

    const nextEnergy = Math.min(
      currentState.energy + ENERGY_PER_CHARGE,
      MAX_COSMIC_ENERGY
    );
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from(PROFILE_TABLE)
      .update({
        cosmic_energy: nextEnergy,
        last_energy_charge: nowIso,
      })
      .eq("id", userId);

    if (updateError) {
      mapSupabaseError(updateError, "Enerji güncellenemedi.");
    }

    const session = await createSession(SESSION_DURATION_HOURS);
    const chargeState = buildEnergyChargeState(
      nextEnergy,
      currentState.energyBonus,
      nowIso
    );

    return { energy: nextEnergy, session, chargeState };
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Enerji yüklenirken bir hata oluştu.");
  }
}

export async function consumeCosmicEnergy(
  amount: number = ENERGY_COST_PER_ACTION
): Promise<number> {
  try {
    const userId = await requireAuthUserId();

    const { data, error: readError } = await supabase
      .from(PROFILE_TABLE)
      .select("cosmic_energy, energy_bonus")
      .eq("id", userId)
      .maybeSingle();

    if (readError || !data) {
      mapSupabaseError(readError, "Enerji bilgisi okunamadı.");
    }

    const cosmicEnergy = data.cosmic_energy ?? 0;
    const energyBonus = data.energy_bonus ?? 0;
    const totalEnergy = cosmicEnergy + energyBonus;

    if (amount <= 0) {
      throw new SupabaseActionError("Geçersiz enerji miktarı.");
    }

    if (totalEnergy < amount) {
      throw new SupabaseActionError(
        `Bu işlem için ${amount} enerji gerekir. Mevcut enerji: ${totalEnergy}`
      );
    }

    const next = deductEnergyBalance(cosmicEnergy, energyBonus, amount);

    const { error } = await supabase
      .from(PROFILE_TABLE)
      .update({
        cosmic_energy: next.cosmicEnergy,
        energy_bonus: next.energyBonus,
      })
      .eq("id", userId);

    if (error) {
      mapSupabaseError(error, "Enerji harcanamadı.");
    }

    return next.cosmicEnergy + next.energyBonus;
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      throw error;
    }

    throw new SupabaseActionError("Enerji kontrolü sırasında bir hata oluştu.");
  }
}

export async function consumeCosmicEnergyForQuestion(): Promise<void> {
  await consumeCosmicEnergy(ENERGY_COST_PER_ACTION);
}

export async function consumeTarotEnergy(): Promise<number> {
  if (TAROT_ENERGY_COST <= 0) {
    return getCosmicEnergy();
  }

  return consumeCosmicEnergy(TAROT_ENERGY_COST);
}

export async function getCachedTarotReading(
  userId: string,
  cardIds: string[],
  cacheHours = 24
): Promise<string | null> {
  try {
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

    const { error } = await supabase
      .from(PROFILE_TABLE)
      .update({
        partner_name: input.partnerName.trim(),
        partner_birth_date: input.partnerBirthDate,
        partner_birth_time: input.partnerBirthTime,
        partner_birth_place: input.partnerBirthPlace.trim(),
        relationship_status: "İlişkisi Var",
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

export function formatCountdown(expiresAt: string | null | undefined): string {
  if (!expiresAt) {
    return "00:00:00";
  }

  const remainingMs = new Date(expiresAt).getTime() - Date.now();

  if (remainingMs <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function isSessionActive(session: Session | null): session is Session {
  if (!session?.expires_at) {
    return false;
  }

  return new Date(session.expires_at).getTime() > Date.now();
}
