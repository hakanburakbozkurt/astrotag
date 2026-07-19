import { NextResponse } from "next/server";
import {
  requestSynastryAnalysis,
  SYNASTRY_ERROR_MESSAGE,
} from "@/lib/ai/synastry";
import { formatPresentationForArchive } from "@/lib/analysis/types";
import { buildCosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import { GeocodeValidationError } from "@/lib/astrology/geocode";
import { logSynastryToArchive } from "@/lib/cosmic-journal/log-reading";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import type { UserData } from "@/types/user";

export const POST = withNfcApiRoute(
  "api/ai/compatibility/analyze",
  async (request, access) => {
    const body = await request.json();
    const question = body?.question as string | undefined;
    const userData = body?.userData as UserData | undefined;
    const compatibilityScore = Number(body?.compatibilityScore);
    const partnerName =
      (body?.partnerName as string | undefined)?.trim() ||
      userData?.partnerName?.trim() ||
      "Partner";

    if (!question?.trim() || !userData) {
      return NextResponse.json({ error: SYNASTRY_ERROR_MESSAGE }, { status: 400 });
    }

    let context;
    try {
      context = await buildCosmicAnalysisContext(userData);
    } catch (error) {
      if (error instanceof GeocodeValidationError) {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }
      throw error;
    }

    const result = await requestSynastryAnalysis(question, userData, context);

    await logSynastryToArchive({
      profileId: access.profileId,
      question: question.trim(),
      analysis: formatPresentationForArchive(result.presentation),
      partnerName: partnerName || context.synastry?.partnerName || "Partner",
      compatibilityScore: result.scoreAnalysis?.score ?? compatibilityScore ?? 0,
    });

    return NextResponse.json(result);
  }
);
