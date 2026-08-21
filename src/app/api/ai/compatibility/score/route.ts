import { NextResponse } from "next/server";
import {
  requestSynastryScore,
  SYNASTRY_ERROR_MESSAGE,
  SynastryReadingError,
  type SynastryScoreResponse,
} from "@/lib/ai/synastry";
import {
  getCachedOracleJsonResponse,
  saveCachedOracleJsonResponse,
  synastryScoreCacheSignature,
} from "@/lib/ai/oracle-response-cache.server";
import { loadVerifiedSynastryProfileForAi } from "@/lib/ai/verified-profile.server";
import { GeocodeValidationError } from "@/lib/astrology/geocode";
import { getDailyCompatibilityDateKey } from "@/lib/compatibility/daily-questions";
import { buildSynastryScoreFingerprint } from "@/lib/synastry/synastry-score-engine";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import { SupabaseActionError } from "@/lib/supabase-action-error";

export const POST = withNfcApiRoute(
  "api/ai/compatibility/score",
  async (_request, access) => {
    const dateKey = getDailyCompatibilityDateKey();

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

    const partnerFingerprint = buildSynastryScoreFingerprint(userProfile);
    const cacheSignature = synastryScoreCacheSignature(dateKey, partnerFingerprint);

    const cached = await getCachedOracleJsonResponse<SynastryScoreResponse>(
      access.profileId,
      cacheSignature
    );

    if (cached && Number.isFinite(cached.score)) {
      return NextResponse.json({ ...cached, cached: true });
    }

    try {
      const result = await requestSynastryScore(userProfile, dateKey);

      await saveCachedOracleJsonResponse(
        access.profileId,
        cacheSignature,
        `Synastry score cache · ${dateKey}`,
        result
      );

      return NextResponse.json({ ...result, cached: false });
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
