"use server";

import { randomUUID } from "crypto";
import {
  COSMIC_PROFILE_PIPELINE_FALLBACK,
  runCosmicProfilePipeline,
} from "@/lib/ai/cosmic-profile-pipeline";
import { resolveBirthPlace } from "@/lib/astrology/geocode";
import { trackAnalysisFeedback } from "@/lib/badges/feedback-tracker.server";
import type { GrantedBadgePayload } from "@/lib/badges/badge-definitions";
import {
  getCosmicProfileTier,
  type CosmicProfileFormInput,
  type CosmicProfileMeta,
  type CosmicProfileTierId,
} from "@/lib/cosmic-profile/types";
import {
  COSMIC_PROFILE_REFUND_STARS,
  STAR_PACKAGES_PATH,
} from "@/lib/constants/cosmic";
import { encryptCosmicJournalText } from "@/lib/crypto/cosmic-journal-crypto.server";
import { getNfcSessionProfileId } from "@/lib/nfc/session.server";
import { ORACLE_COSMIC_DATA_ERROR } from "@/lib/oracle/oracle-errors";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  cosmicProfileLedgerType,
  logStarsLedgerEntry,
} from "@/lib/stars/stars-ledger.server";
import { consumeStarPoints, getStarPoints } from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import type { UserData } from "@/types/user";

const PROFILE_TABLE = "profiles";
const COSMIC_READINGS_TABLE = "cosmic_readings";

export type RunCosmicProfileResult =
  | {
      success: true;
      reading: string;
      sessionId: string;
      remainingStars: number;
      tier: CosmicProfileTierId;
      subjectName: string;
      birthPlace: string;
    }
  | {
      success: false;
      error: string;
      redirectTo?: string;
    };

function buildBirthPlace(city: string, district: string): string {
  const cityTrim = city.trim();
  const districtTrim = district.trim();
  return districtTrim ? `${cityTrim}, ${districtTrim}` : cityTrim;
}

function formToUserData(input: CosmicProfileFormInput): UserData {
  return {
    name: input.name.trim(),
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: buildBirthPlace(input.birthCity, input.birthDistrict),
    relationshipStatus: "",
    starPoints: 0,
    starPointsBonus: 0,
  };
}

async function creditStarPointsRefund(userId: string, amount: number): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const { data, error: readError } = await supabase
    .from(PROFILE_TABLE)
    .select("star_points, star_points_bonus")
    .eq("id", userId)
    .maybeSingle();

  if (readError || !data) {
    throw new SupabaseActionError("Yıldız iadesi sırasında profil okunamadı.");
  }

  const starPoints = data.star_points ?? 0;
  const starPointsBonus = (data.star_points_bonus ?? 0) + amount;

  const { error: updateError } = await supabase
    .from(PROFILE_TABLE)
    .update({ star_points_bonus: starPointsBonus })
    .eq("id", userId);

  if (updateError) {
    throw new SupabaseActionError("Yıldız iadesi uygulanamadı.");
  }

  return starPoints + starPointsBonus;
}

export async function runCosmicProfileAnalysis(
  input: CosmicProfileFormInput
): Promise<RunCosmicProfileResult> {
  const userId = await getNfcSessionProfileId();
  if (!userId) {
    return { success: false, error: "Oturum bulunamadı." };
  }

  const name = input.name?.trim();
  const tier = getCosmicProfileTier(input.tier);

  if (!name || !input.birthDate || !input.birthTime || !input.birthCity) {
    return { success: false, error: "Lütfen zorunlu alanları doldurun." };
  }

  try {
    const birthPlace = buildBirthPlace(input.birthCity, input.birthDistrict);
    await resolveBirthPlace(birthPlace);

    const currentStars = await getStarPoints();
    if (currentStars < tier.stars) {
      return {
        success: false,
        error: `Bu analiz için ${tier.stars} yıldız gerekir. Mevcut: ${currentStars}`,
        redirectTo: STAR_PACKAGES_PATH,
      };
    }

    const sessionId = randomUUID();
    const remainingStars = await consumeStarPoints(tier.stars);

    await logStarsLedgerEntry({
      userId,
      transactionType: cosmicProfileLedgerType(tier.id),
      starPointsDelta: -tier.stars,
      referenceId: sessionId,
      metadata: {
        subjectName: name,
        birthPlace,
        tier: tier.id,
      },
    });

    const userData = formToUserData({ ...input, name });
    const reading = await runCosmicProfilePipeline(userData, name, tier.id);

    if (!reading) {
      await creditStarPointsRefund(userId, tier.stars);
      await logStarsLedgerEntry({
        userId,
        transactionType: "REFUND_ANALYSIS",
        starPointsDelta: tier.stars,
        referenceId: sessionId,
        metadata: { reason: "pipeline_failure", tier: tier.id },
      });
      return { success: false, error: COSMIC_PROFILE_PIPELINE_FALLBACK };
    }

    return {
      success: true,
      reading,
      sessionId,
      remainingStars,
      tier: tier.id,
      subjectName: name,
      birthPlace,
    };
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      if (error.message.includes("yıldız gerekir")) {
        return { success: false, error: error.message, redirectTo: STAR_PACKAGES_PATH };
      }
      return { success: false, error: error.message };
    }

    if (error instanceof Error && error.name === "GeocodeValidationError") {
      return { success: false, error: error.message };
    }

    console.error("RUN_COSMIC_PROFILE_ERROR:", error);
    return { success: false, error: ORACLE_COSMIC_DATA_ERROR };
  }
}

export async function submitCosmicProfileFeedback(input: {
  sessionId: string;
  accurate: boolean;
  tier: CosmicProfileTierId;
  subjectName: string;
  birthPlace: string;
  readingPreview?: string;
}): Promise<{
  success: boolean;
  refundedStars?: number;
  remainingStars?: number;
  canSave?: boolean;
  earnedBadges?: GrantedBadgePayload[];
  feedbackCount?: number;
  error?: string;
}> {
  const userId = await getNfcSessionProfileId();
  if (!userId) {
    return { success: false, error: "Oturum bulunamadı." };
  }

  let earnedBadges: GrantedBadgePayload[] = [];
  let feedbackCount = 0;
  let remainingStars: number | undefined;

  try {
    const tracker = await trackAnalysisFeedback({
      userId,
      module: "cosmic-profile",
      accurate: input.accurate,
      tier: input.tier,
      referenceId: input.sessionId,
      metadata: {
        subjectName: input.subjectName,
        birthPlace: input.birthPlace,
        readingPreview: input.readingPreview?.slice(0, 240) ?? null,
      },
    });
    earnedBadges = tracker.earnedBadges;
    feedbackCount = tracker.feedbackCount;

    if (earnedBadges.length > 0) {
      remainingStars = await getStarPoints();
    }
  } catch (error) {
    console.error("COSMIC_PROFILE_FEEDBACK_TRACKER_ERROR:", error);
  }

  if (input.accurate) {
    return {
      success: true,
      canSave: true,
      earnedBadges,
      feedbackCount,
      remainingStars,
    };
  }

  try {
    remainingStars = await creditStarPointsRefund(userId, COSMIC_PROFILE_REFUND_STARS);

    await logStarsLedgerEntry({
      userId,
      transactionType: "REFUND_ANALYSIS",
      starPointsDelta: COSMIC_PROFILE_REFUND_STARS,
      referenceId: input.sessionId,
      metadata: {
        tier: input.tier,
        subjectName: input.subjectName,
        birthPlace: input.birthPlace,
      },
    });

    return {
      success: true,
      refundedStars: COSMIC_PROFILE_REFUND_STARS,
      remainingStars,
      canSave: false,
      earnedBadges,
      feedbackCount,
    };
  } catch (error) {
    console.error("COSMIC_PROFILE_FEEDBACK_ERROR:", error);
    return { success: false, error: ORACLE_COSMIC_DATA_ERROR };
  }
}

export async function saveCosmicProfileToJournal(input: {
  sessionId: string;
  reading: string;
  tier: CosmicProfileTierId;
  subjectName: string;
  birthPlace: string;
}): Promise<{ success: boolean; error?: string }> {
  const userId = await getNfcSessionProfileId();
  if (!userId) {
    return { success: false, error: "Oturum bulunamadı." };
  }

  const reading = input.reading.trim();
  if (!reading) {
    return { success: false, error: "Kaydedilecek analiz bulunamadı." };
  }

  try {
    const tier = getCosmicProfileTier(input.tier);
    const encryptedReading = encryptCosmicJournalText(reading);
    const meta: CosmicProfileMeta = {
      subject_name: input.subjectName.trim(),
      birth_place: input.birthPlace.trim(),
      tier: tier.id,
      tier_label: tier.label,
      encrypted: true,
    };

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from(COSMIC_READINGS_TABLE).insert({
      user_id: userId,
      type: "CosmicProfile",
      question: `${input.subjectName.trim()} · ${tier.label} Kozmik Profil`,
      reading_result: encryptedReading,
      cards_json: meta,
    });

    if (error) {
      console.error("COSMIC_PROFILE_SAVE_ERROR:", error.message);
      return { success: false, error: ORACLE_COSMIC_DATA_ERROR };
    }

    await logStarsLedgerEntry({
      userId,
      transactionType: cosmicProfileLedgerType(tier.id),
      starPointsDelta: 0,
      referenceId: input.sessionId,
      metadata: { action: "journal_saved", tier: tier.id },
    });

    return { success: true };
  } catch (error) {
    console.error("COSMIC_PROFILE_SAVE_ERROR:", error);
    return { success: false, error: ORACLE_COSMIC_DATA_ERROR };
  }
}
