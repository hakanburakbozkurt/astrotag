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
import { TAROT_CACHE_HOURS, TAROT_SPREAD_SIZE } from "@/lib/constants/cosmic";
import { buildCardSignature } from "@/lib/tarot/deck";
import {
  formatPartnerDataForPrompt,
  formatUserDataForPrompt,
  getServerUserProfile,
} from "@/lib/tarot/tarot-profile-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserData } from "@/types/user";

export type { TarotReadingCard } from "@/lib/ai/tarot-pipeline-schemas";

const TAROT_HISTORY_TABLE = "tarot_history";

export type InterpretTarotSpreadResult = {
  reading: string;
  cached: boolean;
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
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return null;
  }

  return user.id;
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

async function getCachedReading(
  userId: string,
  cardIds: string[]
): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const signature = buildCardSignature(cardIds);
  const since = new Date(
    Date.now() - TAROT_CACHE_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
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

  return data?.reading?.trim() ?? null;
}

async function saveReadingHistory(input: {
  userId: string;
  question: string;
  cardIds: string[];
  reading: string;
}): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const signature = buildCardSignature(input.cardIds);

  const { error } = await supabase.from(TAROT_HISTORY_TABLE).insert({
    user_id: input.userId,
    question: input.question.trim(),
    card_ids: input.cardIds,
    card_signature: signature,
    reading: input.reading.trim(),
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
  /** Oturum sunucuda yoksa (ör. dev) istemciden gelen profil yedeği */
  userProfile?: UserData;
}): Promise<InterpretTarotSpreadResult> {
  try {
    if (!process.env.KIE_API_KEY?.trim()) {
      console.error(
        "INTERPRET_TAROT_SPREAD_ERROR: KIE_API_KEY .env.local içinde tanımlı değil"
      );
      return {
        reading: TAROT_ACTION_ERROR_MESSAGE,
        cached: false,
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
        reading: TAROT_ACTION_ERROR_MESSAGE,
        cached: false,
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
        reading: TAROT_ACTION_ERROR_MESSAGE,
        cached: false,
      };
    }

    const { question, cards } = parsed.data;
    const cardIds = cards.map((card) => card.id);

    if (userId) {
      const cached = await getCachedReading(userId, cardIds);
      if (cached) {
        return { reading: cached, cached: true };
      }
    }

    const reading = await runTarotReadingPipeline({
      question,
      cards,
      profile: profileContext,
      userProfile,
      logContext: userId ? { userId } : undefined,
    });

    if (reading === TAROT_READING_FALLBACK_MESSAGE) {
      console.error(
        "INTERPRET_TAROT_SPREAD_ERROR: Kie pipeline fallback döndü"
      );
      return {
        reading: TAROT_ACTION_ERROR_MESSAGE,
        cached: false,
      };
    }

    if (userId && cardIds.length === TAROT_SPREAD_SIZE) {
      await saveReadingHistory({
        userId,
        question,
        cardIds,
        reading,
      });
    }

    return {
      reading,
      cached: false,
    };
  } catch (error) {
    logInterpretError(error, "interpretTarotSpread");
    return {
      reading: TAROT_ACTION_ERROR_MESSAGE,
      cached: false,
    };
  }
}
