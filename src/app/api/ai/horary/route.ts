import { NextResponse } from "next/server";
import { runHoraryReading } from "@/lib/actions/horary-reading";
import { HORARY_ERROR_MESSAGE } from "@/lib/ai/horary";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";

/**
 * @deprecated Tercih edilen giriş: `runHoraryReading` server action.
 * Bu route yalnızca geriye dönük uyumluluk içindir; client `userData` kabul etmez.
 */
export const POST = withNfcApiRoute("api/ai/horary", async (request) => {
  const body = await request.json();
  const question = body?.question as string | undefined;

  if (!question?.trim()) {
    return NextResponse.json(
      {
        error: HORARY_ERROR_MESSAGE,
        answer: HORARY_ERROR_MESSAGE,
      },
      { status: 400 }
    );
  }

  const result = await runHoraryReading(question.trim());

  if (!result.success) {
    const status = result.error.includes("yıldız") ? 402 : 403;
    return NextResponse.json(
      {
        error: result.error,
        answer: result.error,
        redirectTo: result.redirectTo ?? null,
      },
      { status }
    );
  }

  return NextResponse.json({
    answer: result.answer,
    questionId: result.questionId,
    remainingStars: result.remainingStars,
  });
});
