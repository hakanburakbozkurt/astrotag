import { NextResponse } from "next/server";
import {
  COSMIC_ERROR_MESSAGE,
  TarotReadingError,
} from "@/lib/ai/tarot";
import {
  TAROT_READING_FALLBACK_MESSAGE,
} from "@/lib/ai/tarot-constants";
import {
  assignSpreadPositions,
  runTarotReadingPipeline,
} from "@/lib/ai/tarot-pipeline";
import { loadVerifiedUserProfileForAi } from "@/lib/ai/verified-profile.server";
import { TAROT_SPREAD_SIZE, TAROT_STAR_POINTS_COST } from "@/lib/constants/cosmic";
import { getCardById } from "@/data/deck";
import { toClientOraclePresentation } from "@/lib/analysis/presentation-gate.server";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import {
  formatPartnerDataForPrompt,
  formatUserDataForPrompt,
} from "@/lib/tarot/tarot-profile-server";
import {
  consumeTarotStarPoints,
  creditStarPointsBonus,
} from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";

export const POST = withNfcApiRoute("api/ai/tarot", async (request, access) => {
  const body = await request.json();
  const question = body?.question as string | undefined;
  const cardIds = body?.cardIds as string[] | undefined;

  if (
    !question?.trim() ||
    !Array.isArray(cardIds) ||
    cardIds.length !== TAROT_SPREAD_SIZE
  ) {
    return NextResponse.json(
      { error: COSMIC_ERROR_MESSAGE, reading: COSMIC_ERROR_MESSAGE },
      { status: 400 }
    );
  }

  let userProfile;
  try {
    userProfile = await loadVerifiedUserProfileForAi(access.profileId);
  } catch (error) {
    const message =
      error instanceof SupabaseActionError
        ? error.message
        : COSMIC_ERROR_MESSAGE;
    return NextResponse.json(
      { error: message, reading: message },
      { status: 403 }
    );
  }

  const cards = cardIds
    .map((id) => getCardById(id))
    .filter((card): card is NonNullable<typeof card> => Boolean(card))
    .map((card) => ({
      id: card.id,
      name: card.name,
      keywords: card.keywords,
    }));

  if (cards.length !== TAROT_SPREAD_SIZE) {
    return NextResponse.json(
      { error: "Geçersiz kart seçimi.", reading: COSMIC_ERROR_MESSAGE },
      { status: 400 }
    );
  }

  const cardsWithPositions = assignSpreadPositions(cards);
  const profileContext = {
    userData: formatUserDataForPrompt(userProfile),
    partnerData: formatPartnerDataForPrompt(userProfile),
  };

  try {
    await consumeTarotStarPoints();
  } catch (error) {
    const message =
      error instanceof SupabaseActionError
        ? error.message
        : COSMIC_ERROR_MESSAGE;
    return NextResponse.json(
      { error: message, reading: message },
      { status: 402 }
    );
  }

  const presentation = await runTarotReadingPipeline({
    question,
    cards: cardsWithPositions,
    profile: profileContext,
    userProfile,
    logContext: { profileId: access.profileId },
  });

  if (!presentation) {
    if (TAROT_STAR_POINTS_COST > 0) {
      await creditStarPointsBonus(TAROT_STAR_POINTS_COST);
    }
    throw new TarotReadingError(TAROT_READING_FALLBACK_MESSAGE);
  }

  return NextResponse.json({
    presentation: toClientOraclePresentation(presentation),
  });
});
