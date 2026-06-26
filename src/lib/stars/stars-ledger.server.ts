import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

const STARS_LEDGER_TABLE = "stars_ledger";

export type StarsLedgerTransactionType =
  | "COSMIC_PROFILE_ENTRY"
  | "COSMIC_PROFILE_DEPTH"
  | "COSMIC_PROFILE_MASTER"
  | "REFUND_ANALYSIS";

export async function logStarsLedgerEntry(input: {
  userId: string;
  transactionType: StarsLedgerTransactionType;
  starPointsDelta: number;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from(STARS_LEDGER_TABLE).insert({
      user_id: input.userId,
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
