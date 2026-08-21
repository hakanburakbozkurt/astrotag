"use server";

import { redirect } from "next/navigation";
import { requestHoraryReading } from "@/lib/ai/horary";
import { requireVerifiedUserProfileForAi } from "@/lib/ai/verified-profile.server";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";
import { ORACLE_COSMIC_DATA_ERROR } from "@/lib/oracle/oracle-errors";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  consumeStarPoints,
  creditStarPointsBonus,
  getHoraryQuestion,
  updateHoraryAnswer,
} from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { STAR_POINTS_COST_PER_ACTION } from "@/lib/constants/cosmic";
import type { HoraryQuestion, HoraryQuestionInsert } from "@/types/database";

const HORARY_QUESTIONS_TABLE = "horary_questions";
const COSMIC_LOGS_TABLE = "cosmic_logs";
const PROFILE_TABLE = "profiles";

export type RunHoraryReadingResult =
  | {
      success: true;
      answer: string;
      questionId: string;
      remainingStars: number;
    }
  | {
      success: false;
      error: string;
      redirectTo?: string;
    };

function mapSupabaseError(
  error: { message: string } | null,
  fallback: string
): never {
  throw new SupabaseActionError(error?.message ?? fallback);
}

async function ensureProfileComplete(profileId: string): Promise<void> {
  const supabaseAdmin = createServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from(PROFILE_TABLE)
    .select("is_profile_complete")
    .eq("id", profileId)
    .maybeSingle();

  if (error || data?.is_profile_complete !== true) {
    redirect(PROFILE_SETUP_PATH);
  }
}

async function logCosmicQuestion(profileId: string, question: string): Promise<void> {
  const supabaseAdmin = createServiceRoleClient();
  const { error } = await supabaseAdmin.from(COSMIC_LOGS_TABLE).insert({
    user_id: profileId,
    question,
    star_points_delta: -STAR_POINTS_COST_PER_ACTION,
  });

  if (error) {
    console.error("[cosmic_logs] insert failed:", error.message);
  }
}

async function insertHoraryQuestionRow(
  profileId: string,
  question: string
): Promise<HoraryQuestion> {
  const supabaseAdmin = createServiceRoleClient();
  const payload: HoraryQuestionInsert = {
    user_id: profileId,
    question,
    ai_answer: null,
  };

  const { data, error } = await supabaseAdmin
    .from(HORARY_QUESTIONS_TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[runHoraryReading] insert failed", {
      profileId,
      code: error?.code ?? null,
      message: error?.message ?? null,
    });
    mapSupabaseError(error, "Soru kaydedilemedi.");
  }

  return data as HoraryQuestion;
}

/**
 * Horary — doğrulanmış profil, yıldız harcama, DB kaydı, KIE pipeline (atomik iade).
 */
export async function runHoraryReading(question: string): Promise<RunHoraryReadingResult> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { success: false, error: "Lütfen bir soru yazın." };
  }

  try {
    const { profileId, profile } = await requireVerifiedUserProfileForAi("self");
    await ensureProfileComplete(profileId);

    let remainingStars: number;
    try {
      remainingStars = await consumeStarPoints(STAR_POINTS_COST_PER_ACTION);
    } catch (error) {
      const message =
        error instanceof SupabaseActionError
          ? error.message
          : "Yıldız puanı harcanamadı.";
      return { success: false, error: message };
    }

    await logCosmicQuestion(profileId, trimmed);

    let record: HoraryQuestion;
    try {
      record = await insertHoraryQuestionRow(profileId, trimmed);
    } catch (error) {
      await creditStarPointsBonus(STAR_POINTS_COST_PER_ACTION);
      const message =
        error instanceof SupabaseActionError
          ? error.message
          : "Soru kaydedilemedi.";
      return { success: false, error: message };
    }

    try {
      const aiResult = await requestHoraryReading(trimmed, profile, {
        logContext: { profileId },
      });

      await updateHoraryAnswer(
        record.id,
        aiResult.answer,
        aiResult.cosmicContext ?? null
      );

      const saved = await getHoraryQuestion(record.id);
      if (!saved?.ai_answer?.trim()) {
        throw new Error("answer_missing");
      }

      return {
        success: true,
        answer: saved.ai_answer,
        questionId: record.id,
        remainingStars,
      };
    } catch (error) {
      await creditStarPointsBonus(STAR_POINTS_COST_PER_ACTION);
      console.error("[runHoraryReading] pipeline failed:", error);
      return { success: false, error: ORACLE_COSMIC_DATA_ERROR };
    }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      String((error as { digest?: string }).digest ?? "").includes("NEXT_REDIRECT")
    ) {
      return { success: false, error: "Profil tamamlanmalı.", redirectTo: PROFILE_SETUP_PATH };
    }

    if (error instanceof SupabaseActionError) {
      return { success: false, error: error.message };
    }

    console.error("[runHoraryReading] unexpected error:", error);
    return { success: false, error: ORACLE_COSMIC_DATA_ERROR };
  }
}
