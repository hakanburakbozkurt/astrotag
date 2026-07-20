import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service";

const STARS_LEDGER_TABLE = "stars_ledger";

export type StarsLedgerTransactionType =
  | "COSMIC_PROFILE_ENTRY"
  | "COSMIC_PROFILE_DEPTH"
  | "COSMIC_PROFILE_MASTER"
  | "REFUND_ANALYSIS"
  | "BADGE_REWARD"
  | "FEEDBACK_REWARD"
  | "MILESTONE_REWARD";

/** @param input.profileId — profiles.id (auth.uid() değil) */
export async function logStarsLedgerEntry(input: {
  profileId: string;
  transactionType: StarsLedgerTransactionType;
  starPointsDelta: number;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const profileId = input.profileId.trim();
  if (!profileId) {
    console.error("STARS_LEDGER_LOG_ERROR: profileId boş");
    return;
  }

  try {
    const supabaseAdmin = createServiceRoleClient();
    const { error } = await supabaseAdmin.from(STARS_LEDGER_TABLE).insert({
      user_id: profileId,
      transaction_type: input.transactionType,
      star_points_delta: input.starPointsDelta,
      reference_id: input.referenceId ?? null,
      metadata: input.metadata ?? null,
    });

    if (error) {
      console.error("STARS_LEDGER_LOG_ERROR:", error.message);
    }
  } catch (error) {
    console.error("STARS_LEDGER_LOG_ERROR:", error);
  }
}

export function cosmicProfileLedgerType(
  tier: "entry" | "depth" | "master"
): StarsLedgerTransactionType {
  switch (tier) {
    case "entry":
      return "COSMIC_PROFILE_ENTRY";
    case "depth":
      return "COSMIC_PROFILE_DEPTH";
    case "master":
      return "COSMIC_PROFILE_MASTER";
  }
}
