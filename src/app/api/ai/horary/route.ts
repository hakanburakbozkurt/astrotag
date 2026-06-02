import { NextRequest, NextResponse } from "next/server";
import {
  HORARY_ERROR_MESSAGE,
  HoraryReadingError,
  requestHoraryReading,
} from "@/lib/ai/horary";
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

    if (!question?.trim() || !userData) {
      return NextResponse.json(
        {
          error: HORARY_ERROR_MESSAGE,
          answer: HORARY_ERROR_MESSAGE,
        },
        { status: 400 }
      );
    }

    const result = await requestHoraryReading(question, userData, {
      logContext: { userId: guard.access.profileId },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("HORARY_API_ERROR:", error);

    const message =
      error instanceof HoraryReadingError
        ? error.message
        : HORARY_ERROR_MESSAGE;

    return NextResponse.json(
      {
        error: message,
        answer: message,
      },
      { status: 500 }
    );
  }
}
