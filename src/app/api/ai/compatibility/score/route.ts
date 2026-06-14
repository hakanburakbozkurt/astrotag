import { NextResponse } from "next/server";
import {
  requestSynastryScore,
  SYNASTRY_ERROR_MESSAGE,
} from "@/lib/ai/synastry";
import { buildCosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import { GeocodeValidationError } from "@/lib/astrology/geocode";
import { getDailyCompatibilityDateKey } from "@/lib/compatibility/daily-questions";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import type { UserData } from "@/types/user";

export const POST = withNfcApiRoute(
  "api/ai/compatibility/score",
  async (request) => {
    const body = await request.json();
    const userData = body?.userData as UserData | undefined;

    if (!userData) {
      return NextResponse.json({ error: SYNASTRY_ERROR_MESSAGE }, { status: 400 });
    }

    const dateKey = getDailyCompatibilityDateKey();

    let context;
    try {
      context = await buildCosmicAnalysisContext(userData);
    } catch (error) {
      if (error instanceof GeocodeValidationError) {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }
      throw error;
    }

    const result = await requestSynastryScore(userData, context, dateKey);

    return NextResponse.json(result);
  }
);
