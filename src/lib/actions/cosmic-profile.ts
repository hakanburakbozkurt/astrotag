"use server";

import { randomUUID } from "crypto";
import {
  COSMIC_PROFILE_PIPELINE_FALLBACK,
  runCosmicProfilePipeline,
} from "@/lib/ai/cosmic-profile-pipeline";
import { resolveBirthPlace } from "@/lib/astrology/geocode";
import { submitFeedback } from "@/lib/actions/feedback";
import type { GrantedBadgePayload } from "@/lib/badges/badge-definitions";
import {
  DEFAULT_COSMIC_PROFILE_TIER,
  getCosmicProfileTier,
  type CosmicProfileMeta,
  type CosmicProfilePersonInput,
  type CosmicProfileTierId,
} from "@/lib/cosmic-profile/types";
import { getServerUserProfile } from "@/lib/tarot/tarot-profile-server";
import {
  resolveVerifiedSubjectProfile,
  type VerifiedProfileSubject,
} from "@/lib/ai/verified-profile.server";
import {
  COSMIC_PROFILE_REFUND_STARS,
  STAR_PACKAGES_PATH,
} from "@/lib/constants/cosmic";
import { encryptCosmicJournalText } from "@/lib/crypto/cosmic-journal-crypto.server";
import { ORACLE_COSMIC_DATA_ERROR } from "@/lib/oracle/oracle-errors";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  cosmicProfileLedgerType,
  logStarsLedgerEntry,
} from "@/lib/stars/stars-ledger.server";
import {
  consumeStarPoints,
  creditStarPointsBonus,
  requireAuthUserId,
} from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import type { UserData } from "@/types/user";

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

export type CosmicProfileAnalysisInput = {
  tier?: CosmicProfileTierId;
  subject?: VerifiedProfileSubject;
  relationshipType?: string;
  question?: string;
  self?: CosmicProfilePersonInput;
  partner?: CosmicProfilePersonInput;
};

function applyPersonOverride(
  profile: UserData,
  person: CosmicProfilePersonInput,
  target: "self" | "partner"
): void {
  const name = person.name.trim();
  const birthDate = person.birthDate.trim();
  const birthTime = person.birthTime.trim();
  const birthPlace = person.birthPlace.trim();

  if (target === "self") {
    profile.name = name;
    profile.birthDate = birthDate;
    profile.birthTime = birthTime;
    profile.birthPlace = birthPlace;
    return;
  }

  profile.partnerName = name;
  profile.partnerBirthDate = birthDate;
  profile.partnerBirthTime = birthTime;
  profile.partnerBirthPlace = birthPlace;
}

function mergeCosmicProfileInput(
  ownerProfile: UserData,
  input: CosmicProfileAnalysisInput
): UserData {
  const merged = { ...ownerProfile };

  if (input.self) {
    applyPersonOverride(merged, input.self, "self");
  }

  if (input.partner) {
    applyPersonOverride(merged, input.partner, "partner");
  }

  if (input.relationshipType?.trim()) {
    merged.relationshipStatus = input.relationshipType.trim();
  }

  return merged;
}

export async function runCosmicProfileAnalysis(
  input: CosmicProfileAnalysisInput
): Promise<RunCosmicProfileResult> {
  try {
    const subject = input.subject ?? "self";
    const profileId = await requireAuthUserId();
    const ownerProfile = await getServerUserProfile(profileId);

    if (!ownerProfile) {
      throw new SupabaseActionError("Kullanıcı profili alınamadı.");
    }

    const mergedProfile = mergeCosmicProfileInput(ownerProfile, input);
    const userData = resolveVerifiedSubjectProfile(mergedProfile, subject);
    const tier = getCosmicProfileTier(input.tier ?? DEFAULT_COSMIC_PROFILE_TIER);
    const subjectName = userData.name.trim();
    const birthPlace = userData.birthPlace.trim();

    await resolveBirthPlace(birthPlace);

    const sessionId = randomUUID();
    const remainingStars = await consumeStarPoints(tier.stars);

    await logStarsLedgerEntry({
      profileId,
      transactionType: cosmicProfileLedgerType(tier.id),
      starPointsDelta: -tier.stars,
      referenceId: sessionId,
      metadata: {
        subjectName,
        birthPlace,
        tier: tier.id,
        subject,
        relationshipType: input.relationshipType?.trim() || null,
        question: input.question?.trim() || null,
      },
    });

    const reading = await runCosmicProfilePipeline(
      userData,
      subjectName,
      tier.id,
      input.question?.trim() || undefined
    );

    if (!reading) {
      await creditStarPointsBonus(tier.stars);
      await logStarsLedgerEntry({
        profileId,
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
      subjectName,
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
  rating: number;
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
  const profileId = await requireAuthUserId();

  let earnedBadges: GrantedBadgePayload[] = [];
  let feedbackCount = 0;
  let remainingStars: number | undefined;

  const feedbackResult = await submitFeedback({
    module: "cosmic-profile",
    rating: input.rating,
    referenceId: input.sessionId,
    tier: input.tier,
    metadata: {
      subjectName: input.subjectName,
      birthPlace: input.birthPlace,
      readingPreview: input.readingPreview?.slice(0, 240) ?? null,
    },
  });

  if (!feedbackResult.success) {
    return { success: false, error: feedbackResult.error ?? "Geri bildirim kaydedilemedi." };
  }

  earnedBadges = feedbackResult.earnedBadges ?? [];
  feedbackCount = feedbackResult.feedbackCount ?? 0;
  remainingStars = feedbackResult.totalStarPoints;

  const positiveFeedback = input.rating >= 3;

  if (positiveFeedback) {
    return {
      success: true,
      canSave: true,
      earnedBadges,
      feedbackCount,
      remainingStars,
    };
  }

  try {
    remainingStars = await creditStarPointsBonus(COSMIC_PROFILE_REFUND_STARS);

    await logStarsLedgerEntry({
      profileId,
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
  const profileId = await requireAuthUserId();

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

    const supabaseAdmin = createServiceRoleClient();
    const { error } = await supabaseAdmin.from(COSMIC_READINGS_TABLE).insert({
      user_id: profileId,
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
      profileId,
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
