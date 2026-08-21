"use server";

import {
  TAROT_ACTION_ERROR_MESSAGE,
  TAROT_READING_FALLBACK_MESSAGE,
} from "@/lib/ai/tarot-constants";
import {
  assignSpreadPositions,
  runTarotReadingPipeline,
} from "@/lib/ai/tarot-pipeline";
import {
  TarotPipelineInputSchema,
  type TarotReadingCard,
} from "@/lib/ai/tarot-pipeline-schemas";
import {
  deserializeOraclePresentation,
  serializeOraclePresentation,
} from "@/lib/analysis/presentation-storage";
import { toClientOraclePresentation } from "@/lib/analysis/presentation-gate.server";
import type { OracleAnalysisPresentation } from "@/lib/analysis/types";
import { requireVerifiedUserProfileForAi } from "@/lib/ai/verified-profile.server";
import {
  STAR_POINTS_COST_PER_ACTION,
  TAROT_CACHE_HOURS,
  TAROT_SPREAD_SIZE,
  TAROT_STAR_POINTS_COST,
} from "@/lib/constants/cosmic";
import { buildCardSignature } from "@/lib/tarot/deck";
import {
  formatPartnerDataForPrompt,
  formatUserDataForPrompt,
} from "@/lib/tarot/tarot-profile-server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  creditStarPointsBonus,
  consumeStarPoints,
  consumeTarotStarPoints,
} from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";

export type { TarotReadingCard } from "@/lib/ai/tarot-pipeline-schemas";

const TAROT_HISTORY_TABLE = "tarot_history";

const PREMIUM_OPTIONS = {
  cost: STAR_POINTS_COST_PER_ACTION,
  isPremium: true,
} as const;

export type InterpretTarotSpreadResult = {
  presentation: OracleAnalysisPresentation | null;
  cached: boolean;
  errorMessage?: string;
};

export type UnlockTarotDetailsResult =
  | { ok: true; details: string; remainingStars: number }
  | { ok: false; error: string };

function toClientResult(
  presentation: OracleAnalysisPresentation,
  cached: boolean
): InterpretTarotSpreadResult {
  return {
    presentation: toClientOraclePresentation(presentation),
    cached,
  };
}

function logInterpretError(error: unknown, context: string): void {
  if (error instanceof Error) {
    console.error(`INTERPRET_TAROT_SPREAD_ERROR [${context}]:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return;
  }

  console.error(`INTERPRET_TAROT_SPREAD_ERROR [${context}]:`, error);
}

async function getCachedPresentation(
  userId: string,
  cardIds: string[]
): Promise<OracleAnalysisPresentation | null> {
  const supabaseAdmin = createServiceRoleClient();
  const signature = buildCardSignature(cardIds);
  const since = new Date(
    Date.now() - TAROT_CACHE_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabaseAdmin
    .from(TAROT_HISTORY_TABLE)
    .select("reading")
    .eq("user_id", userId)
    .eq("card_signature", signature)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("TAROT_CACHE_READ_ERROR:", error.message);
    return null;
  }

  const raw = data?.reading?.trim();
  if (!raw) {
    return null;
  }

  return deserializeOraclePresentation(raw, PREMIUM_OPTIONS);
}

async function saveReadingHistory(input: {
  userId: string;
  question: string;
  cardIds: string[];
  presentation: OracleAnalysisPresentation;
}): Promise<void> {
  const supabaseAdmin = createServiceRoleClient();
  const signature = buildCardSignature(input.cardIds);

  const { error } = await supabaseAdmin.from(TAROT_HISTORY_TABLE).insert({
    user_id: input.userId,
    question: input.question.trim(),
    card_ids: input.cardIds,
    card_signature: signature,
    reading: serializeOraclePresentation(input.presentation),
  });

  if (error) {
    console.error("TAROT_HISTORY_SAVE_ERROR:", error.message);
  }
}

/**
 * Tarot yorumu — Server Action (Kie.ai + doğrulanmış Supabase profili).
 */
export async function interpretTarotSpread(input: {
  question: string;
  cards: TarotReadingCard[];
}): Promise<InterpretTarotSpreadResult> {
  try {
    if (!process.env.KIE_API_KEY?.trim()) {
      console.error(
        "INTERPRET_TAROT_SPREAD_ERROR: KIE_API_KEY .env.local içinde tanımlı değil"
      );
      return {
        presentation: null,
        cached: false,
        errorMessage: TAROT_ACTION_ERROR_MESSAGE,
      };
    }

    const { profileId, profile: userProfile } =
      await requireVerifiedUserProfileForAi("self");

    const cardsWithPositions = assignSpreadPositions(input.cards);
    const profileContext = {
      userData: formatUserDataForPrompt(userProfile),
      partnerData: formatPartnerDataForPrompt(userProfile),
    };

    const parsed = TarotPipelineInputSchema.safeParse({
      question: input.question,
      cards: cardsWithPositions,
      profile: profileContext,
    });

    if (!parsed.success) {
      console.error(
        "INTERPRET_TAROT_SPREAD_ERROR: Geçersiz girdi",
        parsed.error.flatten()
      );
      return {
        presentation: null,
        cached: false,
        errorMessage: TAROT_ACTION_ERROR_MESSAGE,
      };
    }

    const { question, cards } = parsed.data;
    const cardIds = cards.map((card) => card.id);

    const cached = await getCachedPresentation(profileId, cardIds);
    if (cached) {
      return toClientResult(cached, true);
    }

    await consumeTarotStarPoints();

    const presentation = await runTarotReadingPipeline({
      question,
      cards,
      profile: profileContext,
      userProfile,
      logContext: { profileId },
    });

    if (!presentation) {
      if (TAROT_STAR_POINTS_COST > 0) {
        await creditStarPointsBonus(TAROT_STAR_POINTS_COST);
      }

      console.error(
        "INTERPRET_TAROT_SPREAD_ERROR: Kie pipeline fallback döndü"
      );
      return {
        presentation: null,
        cached: false,
        errorMessage: TAROT_READING_FALLBACK_MESSAGE,
      };
    }

    if (cardIds.length === TAROT_SPREAD_SIZE) {
      await saveReadingHistory({
        userId: profileId,
        question,
        cardIds,
        presentation,
      });
    }

    return toClientResult(presentation, false);
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      return {
        presentation: null,
        cached: false,
        errorMessage: error.message,
      };
    }

    logInterpretError(error, "interpretTarotSpread");
    return {
      presentation: null,
      cached: false,
      errorMessage: TAROT_ACTION_ERROR_MESSAGE,
    };
  }
}

/**
 * Premium tarot detayları — yıldız harcandıktan sonra sunucudan tam metin.
 */
export async function unlockTarotAnalysisDetails(input: {
  cardIds: string[];
}): Promise<UnlockTarotDetailsResult> {
  try {
    if (!Array.isArray(input.cardIds) || input.cardIds.length !== TAROT_SPREAD_SIZE) {
      return { ok: false, error: "Geçersiz kart seçimi." };
    }

    const { profileId } = await requireVerifiedUserProfileForAi("self");
    const stored = await getCachedPresentation(profileId, input.cardIds);

    if (!stored?.details?.trim()) {
      return {
        ok: false,
        error: "Detaylar bulunamadı. Önce tarot yorumunu tamamlayın.",
      };
    }

    const remainingStars = await consumeStarPoints(STAR_POINTS_COST_PER_ACTION);

    return {
      ok: true,
      details: stored.details.trim(),
      remainingStars,
    };
  } catch (error) {
    if (error instanceof SupabaseActionError) {
      return { ok: false, error: error.message };
    }

    logInterpretError(error, "unlockTarotAnalysisDetails");
    return { ok: false, error: TAROT_ACTION_ERROR_MESSAGE };
  }
}
