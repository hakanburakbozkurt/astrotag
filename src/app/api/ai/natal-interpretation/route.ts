import { NextResponse } from "next/server";
import { requestAstrologyInterpretation } from "@/lib/ai/astrology-interpretation";
import {
  calculateNatalChart,
  getNatalChartSummary,
} from "@/lib/astrology/planet-positions";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import type { UserData } from "@/types/user";

export const POST = withNfcApiRoute(
  "api/ai/natal-interpretation",
  async (request) => {
    const body = await request.json();
    const userData = body?.userData as UserData | undefined;

    if (!userData?.birthDate || !userData?.birthTime || !userData?.birthPlace) {
      return NextResponse.json(
        { error: "Doğum bilgileri eksik.", interpretation: "" },
        { status: 400 }
      );
    }

    const chart = await calculateNatalChart({
      birthDate: userData.birthDate,
      birthTime: userData.birthTime,
      birthPlace: userData.birthPlace,
    });

    const summary = getNatalChartSummary(chart);
    const result = await requestAstrologyInterpretation(userData, summary);

    return NextResponse.json(result);
  }
);
