import { NextRequest, NextResponse } from "next/server";
import {
  HORARY_ERROR_MESSAGE,
  HoraryReadingError,
  requestHoraryReading,
} from "@/lib/ai/horary";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserData } from "@/types/user";

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return null;
  }

  return user.id;
}

export async function POST(request: NextRequest) {
  try {
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

    const userId = await getAuthUserId();
    const result = await requestHoraryReading(question, userData, {
      logContext: userId ? { userId } : undefined,
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
