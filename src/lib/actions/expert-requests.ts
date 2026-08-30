"use server";

import { requireAuthUserId } from "@/lib/supabase-actions";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type ExpertIncomingRequest = {
  id: string;
  crystalsSpent: number;
  grossTry: number;
  expertPayoutTry: number;
  status: string;
  createdAt: string;
  serviceName: string | null;
};

export async function listExpertIncomingRequestsAction(): Promise<
  | { ok: true; requests: ExpertIncomingRequest[] }
  | { ok: false; error: string }
> {
  try {
    const profileId = await requireAuthUserId();
    const admin = createServiceRoleClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("user_role")
      .eq("id", profileId)
      .maybeSingle();

    if (profile?.user_role !== "expert") {
      return { ok: false, error: "Bu sayfa yalnızca uzman hesapları içindir." };
    }

    const { data: expert } = await admin
      .from("expert_profiles")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (!expert?.id) {
      return { ok: true, requests: [] };
    }

    const { data: rows, error } = await admin
      .from("expert_earnings_ledger")
      .select(
        "id, crystals_spent, gross_try, expert_payout_try, status, created_at, expert_services(name)"
      )
      .eq("expert_profile_id", expert.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return { ok: false, error: error.message };
    }

    const requests: ExpertIncomingRequest[] = (rows ?? []).map((row) => {
      const serviceMeta = row.expert_services as
        | { name?: string }
        | Array<{ name?: string }>
        | null;

      const serviceName = Array.isArray(serviceMeta)
        ? serviceMeta[0]?.name ?? null
        : serviceMeta?.name ?? null;

      return {
        id: row.id,
        crystalsSpent: row.crystals_spent,
        grossTry: Number(row.gross_try),
        expertPayoutTry: Number(row.expert_payout_try),
        status: row.status,
        createdAt: row.created_at,
        serviceName,
      };
    });

    return { ok: true, requests };
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}
