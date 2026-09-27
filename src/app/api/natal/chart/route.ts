import { NextResponse } from "next/server";
import { loadVerifiedUserProfileForAi } from "@/lib/ai/verified-profile.server";
import { calculateNatalChart } from "@/lib/astrology/planet-positions";
import { serializeNatalChartData } from "@/lib/natal/natal-chart-serialize";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { ORACLE_COSMIC_DATA_ERROR } from "@/lib/oracle/oracle-errors";

export const POST = withNfcApiRoute("api/natal/chart", async (_request, access) => {
  try {
    const profile = await loadVerifiedUserProfileForAi(access.profileId);
    const chart = await calculateNatalChart({
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      birthPlace: profile.birthPlace,
    });

    return NextResponse.json({
      chart: serializeNatalChartData(chart),
      subjectName: profile.name?.trim() ?? "",
      birthMeta: `${profile.birthDate} · ${profile.birthTime} · ${profile.birthPlace}`,
    });
  } catch (error) {
    const message =
      error instanceof SupabaseActionError
        ? error.message
        : ORACLE_COSMIC_DATA_ERROR;

    const status = error instanceof SupabaseActionError ? 403 : 500;

    return NextResponse.json({ error: message, chart: null }, { status });
  }
});
