import { NextRequest, NextResponse } from "next/server";
import { loadVerifiedUserProfileForAi } from "@/lib/ai/verified-profile.server";
import { calculateNatalChart } from "@/lib/astrology/planet-positions";
import { serializeNatalChartData } from "@/lib/natal/natal-chart-serialize";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import type { ProtectedNfcContext } from "@/lib/nfc/protected-access.server";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { ORACLE_COSMIC_DATA_ERROR } from "@/lib/oracle/oracle-errors";

/** Mobil sözleşme: POST body `{}` — profil sunucuda okunur. */
async function readNatalChartRequestBody(
  request: NextRequest
): Promise<NextResponse | null> {
  let raw = "";

  try {
    raw = await request.text();
  } catch {
    return NextResponse.json(
      { error: "İstek gövdesi okunamadı.", chart: null },
      { status: 400 }
    );
  }

  if (!raw.trim()) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json(
        { error: "Geçersiz istek gövdesi.", chart: null },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Geçersiz JSON.", chart: null },
      { status: 400 }
    );
  }

  return null;
}

async function handleNatalChartPost(
  request: NextRequest,
  access: ProtectedNfcContext
): Promise<NextResponse> {
  const bodyError = await readNatalChartRequestBody(request);
  if (bodyError) {
    return bodyError;
  }

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
}

const runNatalChartRoute = withNfcApiRoute(
  "api/natal/chart",
  handleNatalChartPost
);

/**
 * App Router POST handler.
 * Auth: `guardApiNfcAccess` (cookie veya `Authorization: Bearer` Supabase JWT).
 */
export async function POST(request: Request) {
  return runNatalChartRoute(request as NextRequest);
}
