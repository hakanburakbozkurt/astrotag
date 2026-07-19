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
import type { OracleAnalysisPresentation } from "@/lib/analysis/types";
import { STAR_POINTS_COST_PER_ACTION, TAROT_CACHE_HOURS, TAROT_SPREAD_SIZE } from "@/lib/constants/cosmic";
import { buildCardSignature } from "@/lib/tarot/deck";
import {
  formatPartnerDataForPrompt,
  formatUserDataForPrompt,
  getServerUserProfile,
} from "@/lib/tarot/tarot-profile-server";
import { getNfcSessionProfileId } from "@/lib/nfc/session.server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { UserData } from "@/types/user";

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

async function getServerAuthUserId(): Promise<string | null> {
  return getNfcSessionProfileId();
}

async function resolveUserProfileForReading(
  userId: string | null,
  clientProfile?: UserData
): Promise<UserData | null> {
  if (userId) {
    const serverProfile = await getServerUserProfile(userId);
    if (serverProfile) {
      return serverProfile;
    }
  }

  if (clientProfile?.name && clientProfile.birthDate) {
    return clientProfile;
  }

  return null;
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
 * Tarot yorumu — Server Action (Kie.ai + Supabase profil kişiselleştirmesi).
 */
export async function interpretTarotSpread(input: {
  question: string;
  cards: TarotReadingCard[];
  userProfile?: UserData;
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

    const cardsWithPositions = assignSpreadPositions(input.cards);
    const userId = await getServerAuthUserId();

    const userProfile = await resolveUserProfileForReading(
      userId,
      input.userProfile
    );

    if (!userProfile) {
      console.error(
        "INTERPRET_TAROT_SPREAD_ERROR: Kullanıcı profili alınamadı (Supabase oturumu veya profil eksik)"
      );
      return {
        presentation: null,
        cached: false,
        errorMessage: TAROT_ACTION_ERROR_MESSAGE,
      };
    }

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

    if (userId) {
      const cached = await getCachedPresentation(userId, cardIds);
      if (cached) {
        return { presentation: cached, cached: true };
      }
    }

    const presentation = await runTarotReadingPipeline({
      question,
      cards,
      profile: profileContext,
      userProfile,
      logContext: userId ? { profileId: userId } : undefined,
    });

    if (!presentation) {
      console.error(
        "INTERPRET_TAROT_SPREAD_ERROR: Kie pipeline fallback döndü"
      );
      return {
        presentation: null,
        cached: false,
        errorMessage: TAROT_READING_FALLBACK_MESSAGE,
      };
    }

    if (userId && cardIds.length === TAROT_SPREAD_SIZE) {
      await saveReadingHistory({
        userId,
        question,
        cardIds,
        presentation,
      });
    }

    return {
      presentation,
      cached: false,
    };
  } catch (error) {
    logInterpretError(error, "interpretTarotSpread");
    return {
      presentation: null,
      cached: false,
      errorMessage: TAROT_ACTION_ERROR_MESSAGE,
    };
  }
}
