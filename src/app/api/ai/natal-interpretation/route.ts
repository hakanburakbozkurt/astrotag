import { NextRequest, NextResponse } from "next/server";
import {
  COSMIC_ERROR_MESSAGE,
  TarotReadingError,
} from "@/lib/ai/tarot";
import { requestAstrologyInterpretation } from "@/lib/ai/astrology-interpretation";
import {
  calculateNatalChart,
  getNatalChartSummary,
} from "@/lib/astrology/planet-positions";
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
  } catch (error) {
    console.error("NATAL_INTERPRETATION_ERROR:", error);

    const message =
      error instanceof TarotReadingError
        ? error.message
        : COSMIC_ERROR_MESSAGE;

    return NextResponse.json(
      { error: message, interpretation: message },
      { status: 500 }
    );
  }
}
