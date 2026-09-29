import { NextResponse } from "next/server";
import {
  runCosmicProfileAnalysisForProfile,
  type CosmicProfileAnalysisInput,
} from "@/lib/actions/cosmic-profile";
import { ORACLE_COSMIC_DATA_ERROR } from "@/lib/oracle/oracle-errors";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";

export const POST = withNfcApiRoute("api/ai/cosmic-profile", async (request, access) => {
  const body = (await request.json()) as CosmicProfileAnalysisInput;

  if (!body?.self?.name?.trim() || !body.self.birthDate?.trim() || !body.self.birthTime?.trim() || !body.self.birthPlace?.trim()) {
    return NextResponse.json(
      {
        error: "Doğum bilgilerinin tamamını girin.",
        reading: ORACLE_COSMIC_DATA_ERROR,
      },
      { status: 400 }
    );
  }

  const result = await runCosmicProfileAnalysisForProfile(access.profileId, {
    tier: body.tier,
    subject: body.subject ?? "self",
    relationshipType: body.relationshipType,
    question: body.question,
    self: body.self,
    partner: body.partner,
  });

  if (!result.success) {
    const status = result.error.includes("yıldız") ? 402 : 403;
    return NextResponse.json(
      {
        error: result.error,
        redirectTo: result.redirectTo ?? null,
      },
      { status }
    );
  }

  return NextResponse.json({
    reading: result.reading,
    sessionId: result.sessionId,
    remainingStars: result.remainingStars,
    tier: result.tier,
    subjectName: result.subjectName,
    birthPlace: result.birthPlace,
  });
});
