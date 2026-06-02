import { NextRequest, NextResponse } from "next/server";
import {
  requestSynastryScore,
  SYNASTRY_ERROR_MESSAGE,
  SynastryReadingError,
} from "@/lib/ai/synastry";
import { buildCosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import { getDailyCompatibilityDateKey } from "@/lib/compatibility/daily-questions";
import { guardApiNfcAccess } from "@/lib/nfc/api-guard";
import type { UserData } from "@/types/user";

export async function POST(request: NextRequest) {
  try {
    const guard = await guardApiNfcAccess();
    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json();
    const userData = body?.userData as UserData | undefined;

    if (!userData) {
      return NextResponse.json({ error: SYNASTRY_ERROR_MESSAGE }, { status: 400 });
    }

    const dateKey = getDailyCompatibilityDateKey();
    const context = await buildCosmicAnalysisContext(userData);
    const result = await requestSynastryScore(userData, context, dateKey);

    return NextResponse.json(result);
  } catch (error) {
    console.error("COMPATIBILITY_SCORE_API_ERROR:", error);

    const message =
      error instanceof SynastryReadingError
        ? error.message
        : SYNASTRY_ERROR_MESSAGE;

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
