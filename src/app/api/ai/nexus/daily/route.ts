import { NextResponse } from "next/server";
import { NEXUS_ERROR_MESSAGE, requestNexusDaily } from "@/lib/ai/nexus";
import { getDailyCompatibilityDateKey } from "@/lib/compatibility/daily-questions";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";
import type { UserData } from "@/types/user";

export const POST = withNfcApiRoute("api/ai/nexus/daily", async (request) => {
  const body = await request.json();
  const userData = body?.userData as UserData | undefined;

  if (!userData?.name || !userData?.birthDate) {
    return NextResponse.json({ error: NEXUS_ERROR_MESSAGE }, { status: 400 });
  }

  const dateKey = getDailyCompatibilityDateKey();
  const result = await requestNexusDaily(userData, dateKey);

  return NextResponse.json(result);
});
