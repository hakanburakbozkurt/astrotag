import { NextResponse } from "next/server";
import { NEXUS_ERROR_MESSAGE, requestNexusDaily } from "@/lib/ai/nexus";
import {
  getCachedOracleJsonResponse,
  nexusDailyCacheSignature,
  saveCachedOracleJsonResponse,
} from "@/lib/ai/oracle-response-cache.server";
import { loadVerifiedUserProfileForAi } from "@/lib/ai/verified-profile.server";
import { getDailyCompatibilityDateKey } from "@/lib/compatibility/daily-questions";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import { SupabaseActionError } from "@/lib/supabase-action-error";

export const POST = withNfcApiRoute("api/ai/nexus/daily", async (_request, access) => {
  const dateKey = getDailyCompatibilityDateKey();
  const cacheSignature = nexusDailyCacheSignature(dateKey);

  const cached = await getCachedOracleJsonResponse<{
    userSign: string;
    partnerSign: string | null;
    userDay: string;
    partnerDay: string | null;
    date: string;
  }>(access.profileId, cacheSignature);

  if (cached?.userDay?.trim()) {
    return NextResponse.json({ ...cached, cached: true });
  }

  let userProfile;
  try {
    userProfile = await loadVerifiedUserProfileForAi(access.profileId);
  } catch (error) {
    const message =
      error instanceof SupabaseActionError
        ? error.message
        : NEXUS_ERROR_MESSAGE;
    return NextResponse.json({ error: message }, { status: 403 });
  }

  try {
    const result = await requestNexusDaily(userProfile, dateKey);

    await saveCachedOracleJsonResponse(
      access.profileId,
      cacheSignature,
      `Nexus daily cache · ${dateKey}`,
      result
    );

    return NextResponse.json({ ...result, cached: false });
  } catch (error) {
    console.error("[nexus/daily] pipeline failed:", error);
    return NextResponse.json({ error: NEXUS_ERROR_MESSAGE }, { status: 500 });
  }
});
