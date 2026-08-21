import { NextResponse } from "next/server";
import {
  requestSynastryAnalysis,
  SYNASTRY_ERROR_MESSAGE,
} from "@/lib/ai/synastry";
import { formatPresentationForArchive } from "@/lib/analysis/types";
import { loadVerifiedSynastryProfileForAi } from "@/lib/ai/verified-profile.server";
import { buildCosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import { GeocodeValidationError } from "@/lib/astrology/geocode";
import { STAR_POINTS_COST_PER_ACTION } from "@/lib/constants/cosmic";
import { logSynastryToArchive } from "@/lib/cosmic-journal/log-reading";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import {
  consumeStarPoints,
  creditStarPointsBonus,
} from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { ORACLE_COSMIC_DATA_ERROR } from "@/lib/oracle/oracle-errors";

export const POST = withNfcApiRoute(
  "api/ai/compatibility/analyze",
  async (request, access) => {
    const body = await request.json();
    const question = body?.question as string | undefined;
    const compatibilityScore = Number(body?.compatibilityScore);

    if (!question?.trim()) {
      return NextResponse.json({ error: SYNASTRY_ERROR_MESSAGE }, { status: 400 });
    }

    let userProfile;
    try {
      userProfile = await loadVerifiedSynastryProfileForAi(access.profileId);
    } catch (error) {
      const message =
        error instanceof SupabaseActionError
          ? error.message
          : SYNASTRY_ERROR_MESSAGE;
      return NextResponse.json({ error: message }, { status: 403 });
    }

    const partnerName = userProfile.partnerName?.trim() || "Partner";

    let remainingStars: number;
    try {
      remainingStars = await consumeStarPoints(STAR_POINTS_COST_PER_ACTION);
    } catch (error) {
      const message =
        error instanceof SupabaseActionError
          ? error.message
          : "Yıldız puanı yetersiz.";
      return NextResponse.json({ error: message }, { status: 402 });
    }

    let context;
    try {
      context = await buildCosmicAnalysisContext(userProfile);
    } catch (error) {
      await creditStarPointsBonus(STAR_POINTS_COST_PER_ACTION);

      if (error instanceof GeocodeValidationError) {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }

      throw error;
    }

    try {
      const result = await requestSynastryAnalysis(question, userProfile, context);
      const presentation = {
        ...result.presentation,
        cost: 0,
        isPremium: false,
      };

      await logSynastryToArchive({
        profileId: access.profileId,
        question: question.trim(),
        analysis: formatPresentationForArchive(presentation),
        partnerName: partnerName || context.synastry?.partnerName || "Partner",
        compatibilityScore:
          result.scoreAnalysis?.score ?? compatibilityScore ?? 0,
      });

      return NextResponse.json({
        ...result,
        presentation,
        remainingStars,
      });
    } catch (error) {
      await creditStarPointsBonus(STAR_POINTS_COST_PER_ACTION);
      console.error("[compatibility/analyze] pipeline failed:", error);
      return NextResponse.json({ error: ORACLE_COSMIC_DATA_ERROR }, { status: 500 });
    }
  }
);
