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
import { TAROT_SPREAD_SIZE } from "@/lib/constants/cosmic";
import { getCardById } from "@/data/deck";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import {
  formatPartnerDataForPrompt,
  formatUserDataForPrompt,
} from "@/lib/tarot/tarot-profile-server";
import type { UserData } from "@/types/user";

export const POST = withNfcApiRoute("api/ai/tarot", async (request, access) => {
  const body = await request.json();
  const question = body?.question as string | undefined;
  const userData = body?.userData as UserData | undefined;
  const cardIds = body?.cardIds as string[] | undefined;

  if (
    !question?.trim() ||
    !userData?.name ||
    !userData?.birthDate ||
    !Array.isArray(cardIds) ||
    cardIds.length !== TAROT_SPREAD_SIZE
  ) {
    return NextResponse.json(
      { error: COSMIC_ERROR_MESSAGE, reading: COSMIC_ERROR_MESSAGE },
      { status: 400 }
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
    userData: formatUserDataForPrompt(userData),
    partnerData: formatPartnerDataForPrompt(userData),
  };

  const reading = await runTarotReadingPipeline({
    question,
    cards: cardsWithPositions,
    profile: profileContext,
    userProfile: userData,
    logContext: { userId: access.profileId },
  });

  if (reading === TAROT_READING_FALLBACK_MESSAGE) {
    throw new TarotReadingError(COSMIC_ERROR_MESSAGE);
  }

  return NextResponse.json({ reading });
});
