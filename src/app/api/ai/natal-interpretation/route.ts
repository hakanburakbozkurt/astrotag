import { NextResponse } from "next/server";
import { requestAstrologyInterpretation } from "@/lib/ai/astrology-interpretation";
import {
  getCachedNatalInterpretation,
  saveCachedNatalInterpretation,
} from "@/lib/ai/natal-interpretation-cache.server";
import { loadVerifiedUserProfileForAi } from "@/lib/ai/verified-profile.server";
import {
  calculateNatalChart,
  getNatalChartSummary,
} from "@/lib/astrology/planet-positions";
import { STAR_POINTS_COST_PER_ACTION } from "@/lib/constants/cosmic";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import {
  consumeStarPoints,
  creditStarPointsBonus,
} from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { ORACLE_COSMIC_DATA_ERROR } from "@/lib/oracle/oracle-errors";

export const POST = withNfcApiRoute(
  "api/ai/natal-interpretation",
  async (_request, access) => {
    let userProfile;
    try {
      userProfile = await loadVerifiedUserProfileForAi(access.profileId);
    } catch (error) {
      const message =
        error instanceof SupabaseActionError
          ? error.message
          : "Doğum bilgileri eksik.";
      return NextResponse.json(
        { error: message, interpretation: "" },
        { status: 403 }
      );
    }

    const cached = await getCachedNatalInterpretation(access.profileId);
    if (cached) {
      return NextResponse.json({
        presentation: cached,
        interpretation: cached.details,
        cached: true,
      });
    }

    let remainingStars: number;
    try {
      remainingStars = await consumeStarPoints(STAR_POINTS_COST_PER_ACTION);
    } catch (error) {
      const message =
        error instanceof SupabaseActionError
          ? error.message
          : "Yıldız puanı yetersiz.";
      return NextResponse.json(
        { error: message, interpretation: "" },
        { status: 402 }
      );
    }

    try {
      const chart = await calculateNatalChart({
        birthDate: userProfile.birthDate,
        birthTime: userProfile.birthTime,
        birthPlace: userProfile.birthPlace,
      });

      const summary = getNatalChartSummary(chart);
      const result = await requestAstrologyInterpretation(userProfile, summary);
      const presentation = {
        ...result.presentation,
        cost: 0,
        isPremium: false,
      };

      await saveCachedNatalInterpretation(access.profileId, presentation);

      return NextResponse.json({
        presentation,
        interpretation: presentation.details,
        cached: false,
        remainingStars,
      });
    } catch (error) {
      await creditStarPointsBonus(STAR_POINTS_COST_PER_ACTION);
      console.error("[natal-interpretation] pipeline failed:", error);
      return NextResponse.json(
        { error: ORACLE_COSMIC_DATA_ERROR, interpretation: "" },
        { status: 500 }
      );
    }
  }
);
