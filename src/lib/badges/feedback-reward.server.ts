import "server-only";

import { FEEDBACK_ACCURATE_STAR_REWARD } from "@/lib/constants/cosmic";
import { logStarsLedgerEntry } from "@/lib/stars/stars-ledger.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PROFILES_TABLE = "profiles";

/** Doğru geri bildirim sonrası bonus yıldız + ledger kaydı */
export async function creditFeedbackAccurateReward(input: {
  profileId: string;
  referenceId?: string;
  module: string;
  amount?: number;
}): Promise<{ starsEarned: number; totalStarPoints: number }> {
  const profileId = input.profileId.trim();
  const amount = input.amount ?? FEEDBACK_ACCURATE_STAR_REWARD;

  if (!profileId || amount <= 0) {
    return { starsEarned: 0, totalStarPoints: 0 };
  }

  const supabaseAdmin = createServiceRoleClient();
  const { data, error: readError } = await supabaseAdmin
    .from(PROFILES_TABLE)
    .select("star_points, star_points_bonus")
    .eq("id", profileId)
    .maybeSingle();

  if (readError || !data) {
    throw new Error("Geri bildirim ödülü için profil okunamadı.");
  }

  const starPoints = data.star_points ?? 0;
  const starPointsBonus = (data.star_points_bonus ?? 0) + amount;

  const { error: updateError } = await supabaseAdmin
    .from(PROFILES_TABLE)
    .update({ star_points_bonus: starPointsBonus })
    .eq("id", profileId);

  if (updateError) {
    throw new Error("Geri bildirim yıldız ödülü uygulanamadı.");
  }

  await logStarsLedgerEntry({
    profileId,
    transactionType: "FEEDBACK_REWARD",
    starPointsDelta: amount,
    referenceId: input.referenceId,
    metadata: { module: input.module, reason: "accurate_feedback" },
  });

  return {
    starsEarned: amount,
    totalStarPoints: starPoints + starPointsBonus,
  };
}
