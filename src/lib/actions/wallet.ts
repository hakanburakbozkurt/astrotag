"use server";

import {
  getExpertPublicProfile,
  getWalletBalances,
  listPublishedExperts,
  recordExpertServicePurchase,
  type ExpertPublicProfile,
  type WalletBalances,
} from "@/lib/experts/experts.server";
import { initCrystalCheckout } from "@/lib/payments/iyzico.server";
import { requireAuthUserId } from "@/lib/supabase-actions";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function getWalletBalancesAction(): Promise<WalletBalances | null> {
  try {
    const profileId = await requireAuthUserId();
    return getWalletBalances(profileId);
  } catch {
    return null;
  }
}

export async function listPublishedExpertsAction() {
  return listPublishedExperts();
}

export async function getExpertPublicProfileAction(
  expertProfileId: string
): Promise<ExpertPublicProfile | null> {
  return getExpertPublicProfile(expertProfileId);
}

export async function initCrystalCheckoutAction(
  packageId: string
): Promise<
  | { ok: true; checkoutUrl: string; transactionId: string; devMode?: boolean }
  | { ok: false; error: string }
> {
  try {
    const profileId = await requireAuthUserId();
    const result = await initCrystalCheckout(profileId, packageId);

    if (!result.ok) {
      return result;
    }

    return {
      ok: true,
      checkoutUrl: result.checkoutUrl,
      transactionId: result.transactionId,
      devMode: result.devMode,
    };
  } catch (error) {
    console.error("[initCrystalCheckoutAction]", error);
    return { ok: false, error: "Ödeme başlatılamadı." };
  }
}

export async function purchaseExpertServiceAction(
  expertProfileId: string,
  serviceId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const profileId = await requireAuthUserId();
    return recordExpertServicePurchase({
      userProfileId: profileId,
      expertProfileId,
      serviceId,
    });
  } catch {
    return { ok: false, error: "Oturum geçersiz." };
  }
}

export async function listCrystalPackagesAction() {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("crystal_packages")
    .select("id, title, crystals, price_try, badge")
    .eq("is_active", true)
    .order("sort_order");

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    crystals: row.crystals,
    priceTry: Number(row.price_try),
    badge: row.badge,
  }));
}
