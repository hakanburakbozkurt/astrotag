import { NextRequest, NextResponse } from "next/server";
import {
  loadVerifiedSynastryProfileForAi,
  loadVerifiedUserProfileForAi,
} from "@/lib/ai/verified-profile.server";
import { GeocodeValidationError } from "@/lib/astrology/geocode";
import type { ProtectedNfcContext } from "@/lib/nfc/protected-access.server";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import { ORACLE_COSMIC_DATA_ERROR } from "@/lib/oracle/oracle-errors";
import {
  mergePartnerIntoUserData,
  parseSynastryApiRequestBody,
  partnerPayloadToInput,
  type SynastryApiRequestBody,
} from "@/lib/synastry/synastry-api-request";
import { SynastryCalculation } from "@/lib/synastry/synastry-calculation";
import { serializeSynastryChartData } from "@/lib/synastry/synastry-chart-serialize";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import type { UserData } from "@/types/user";
import { hasPartnerData } from "@/types/user";

async function readSynastryRequestBody(
  request: NextRequest
): Promise<
  | { ok: true; parsed: ReturnType<typeof parseSynastryApiRequestBody> & { ok: true } }
  | { ok: false; response: NextResponse }
> {
  let raw = "";

  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "İstek gövdesi okunamadı.", synastry: null },
        { status: 400 }
      ),
    };
  }

  let json: unknown = {};
  if (raw.trim()) {
    try {
      json = JSON.parse(raw) as unknown;
    } catch {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Geçersiz JSON.", synastry: null },
          { status: 400 }
        ),
      };
    }
  }

  const parsed = parseSynastryApiRequestBody(json);
  if (!parsed.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: parsed.error, synastry: null },
        { status: 400 }
      ),
    };
  }

  return { ok: true, parsed };
}

async function resolveSynastryUserData(
  access: ProtectedNfcContext,
  body: SynastryApiRequestBody
): Promise<UserData> {
  if (body.partner) {
    const self = await loadVerifiedUserProfileForAi(access.profileId);
    return mergePartnerIntoUserData(
      self,
      partnerPayloadToInput(body.partner)
    );
  }

  return loadVerifiedSynastryProfileForAi(access.profileId);
}

async function handleSynastryPost(
  request: NextRequest,
  access: ProtectedNfcContext
): Promise<NextResponse> {
  const bodyResult = await readSynastryRequestBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  let userData: UserData;

  try {
    userData = await resolveSynastryUserData(access, bodyResult.parsed.body);
  } catch (error) {
    const message =
      error instanceof SupabaseActionError
        ? error.message
        : "Synastry için profil doğrulanamadı.";

    return NextResponse.json(
      { error: message, synastry: null },
      { status: 403 }
    );
  }

  if (!hasPartnerData(userData)) {
    return NextResponse.json(
      {
        error: "Partner doğum bilgileri eksik. Profil veya istek gövdesinde partner verisi gerekir.",
        synastry: null,
      },
      { status: 400 }
    );
  }

  try {
    const outcome = await SynastryCalculation(userData);

    if (!outcome.ok) {
      return NextResponse.json(
        { error: outcome.message, synastry: null },
        { status: 422 }
      );
    }

    return NextResponse.json({
      synastry: serializeSynastryChartData(outcome.data),
      userName: outcome.data.userName,
      partnerName: outcome.data.partnerName,
    });
  } catch (error) {
    if (error instanceof GeocodeValidationError) {
      return NextResponse.json(
        { error: error.message, synastry: null },
        { status: 422 }
      );
    }

    const message =
      error instanceof SupabaseActionError
        ? error.message
        : ORACLE_COSMIC_DATA_ERROR;

    const status = error instanceof SupabaseActionError ? 403 : 500;

    return NextResponse.json({ error: message, synastry: null }, { status });
  }
}

const runSynastryRoute = withNfcApiRoute("api/synastry", handleSynastryPost);

/**
 * Synastry harita hesaplama (cross-aspect). Auth: Bearer veya oturum çerezi.
 *
 * Body örnekleri:
 * - `{}` veya `{ "source": "profile" }` — kullanıcı + profildeki partner
 * - `{ "partner": { "name", "birthDate", "birthTime", "birthPlace" } }` — partner override
 */
export async function POST(request: Request) {
  return runSynastryRoute(request as NextRequest);
}
