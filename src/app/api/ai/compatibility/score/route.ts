import { NextResponse } from "next/server";
import {
  requestSynastryScore,
  SYNASTRY_ERROR_MESSAGE,
} from "@/lib/ai/synastry";
import { buildCosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
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
    const context = await buildCosmicAnalysisContext(userData);
    const result = await requestSynastryScore(userData, context, dateKey);

    return NextResponse.json(result);
  }
);
