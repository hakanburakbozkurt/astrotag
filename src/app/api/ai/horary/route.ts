import { NextResponse } from "next/server";
import { HORARY_ERROR_MESSAGE, requestHoraryReading } from "@/lib/ai/horary";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import type { UserData } from "@/types/user";

export const POST = withNfcApiRoute("api/ai/horary", async (request, access) => {
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
    logContext: { userId: access.profileId },
  });

  return NextResponse.json(result);
});
