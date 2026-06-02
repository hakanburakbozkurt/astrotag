import { NextRequest, NextResponse } from "next/server";
import {
  requestSynastryAnalysis,
  SYNASTRY_ERROR_MESSAGE,
  SynastryReadingError,
} from "@/lib/ai/synastry";
import { buildCosmicAnalysisContext } from "@/lib/astrology/cosmic-context";
import { logSynastryToArchive } from "@/lib/cosmic-journal/log-reading";
import { guardApiNfcAccess } from "@/lib/nfc/api-guard";
import type { UserData } from "@/types/user";

export async function POST(request: NextRequest) {
  try {
    const guard = await guardApiNfcAccess();
    if (!guard.ok) {
      return guard.response;
    }

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

    const context = await buildCosmicAnalysisContext(userData);
    const result = await requestSynastryAnalysis(question, userData, context);

    await logSynastryToArchive({
        userId: guard.access.profileId,
        question: question.trim(),
        analysis: result.analysis,
        partnerName: partnerName || context.synastry?.partnerName || "Partner",
        compatibilityScore: Number.isFinite(compatibilityScore)
          ? compatibilityScore
          : 0,
      });

    return NextResponse.json(result);
  } catch (error) {
    console.error("COMPATIBILITY_ANALYZE_API_ERROR:", error);

    const message =
      error instanceof SynastryReadingError
        ? error.message
        : SYNASTRY_ERROR_MESSAGE;

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
