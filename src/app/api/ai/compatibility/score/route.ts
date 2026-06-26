import { NextResponse } from "next/server";
import {
  requestSynastryScore,
  SYNASTRY_ERROR_MESSAGE,
  SynastryReadingError,
} from "@/lib/ai/synastry";
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

    try {
      const result = await requestSynastryScore(userData, dateKey);
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof GeocodeValidationError) {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }

      if (error instanceof SynastryReadingError) {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }

      throw error;
    }
  }
);
