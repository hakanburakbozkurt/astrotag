import "server-only";

import { randomUUID } from "crypto";
import {
  iyzicoCallbackUrl,
  iyzicoCheckoutReturnUrl,
  isIyzicoConfigured,
} from "@/lib/payments/iyzico.config";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type InitCrystalCheckoutResult =
  | {
      ok: true;
      transactionId: string;
      checkoutUrl: string;
      devMode?: boolean;
    }
  | { ok: false; error: string };

/**
 * İyzico ödeme başlatma.
 * API anahtarları yoksa geliştirme modunda simüle edilmiş checkout URL döner.
 */
export async function initCrystalCheckout(
  profileId: string,
  packageId: string
): Promise<InitCrystalCheckoutResult> {
  const admin = createServiceRoleClient();

  const { data: pkg, error: pkgError } = await admin
    .from("crystal_packages")
    .select("id, title, crystals, price_try, is_active")
    .eq("id", packageId)
    .maybeSingle();

  if (pkgError || !pkg?.is_active) {
    return { ok: false, error: "Kristal paketi bulunamadı." };
  }

  const transactionId = randomUUID();
  const conversationId = `astrotag-${transactionId.slice(0, 8)}`;

  const { error: insertError } = await admin.from("payment_transactions").insert({
    id: transactionId,
    profile_id: profileId,
    package_id: pkg.id,
    amount_try: pkg.price_try,
    crystals_granted: pkg.crystals,
    iyzico_conversation_id: conversationId,
    status: "pending",
  });

  if (insertError) {
    console.error("[initCrystalCheckout] insert failed:", insertError.message);
    return { ok: false, error: "Ödeme kaydı oluşturulamadı." };
  }

  if (!isIyzicoConfigured()) {
    const devCheckoutUrl = `/api/payments/iyzico/dev-complete?tx=${transactionId}`;
    return {
      ok: true,
      transactionId,
      checkoutUrl: devCheckoutUrl,
      devMode: true,
    };
  }

  // Production: İyzico Checkout Form Initialize API entegrasyon noktası
  const checkoutUrl = iyzicoCheckoutReturnUrl(transactionId);

  console.log("[initCrystalCheckout] Iyzico placeholder", {
    transactionId,
    conversationId,
    callback: iyzicoCallbackUrl(),
    amount: pkg.price_try,
  });

  return {
    ok: true,
    transactionId,
    checkoutUrl,
  };
}

export async function completeCrystalPurchase(
  transactionId: string
): Promise<{ ok: boolean; crystalsGranted?: number; error?: string }> {
  const admin = createServiceRoleClient();

  const { data: tx, error: readError } = await admin
    .from("payment_transactions")
    .select("id, profile_id, crystals_granted, status")
    .eq("id", transactionId)
    .maybeSingle();

  if (readError || !tx) {
    return { ok: false, error: "Ödeme kaydı bulunamadı." };
  }

  if (tx.status === "success") {
    return { ok: true, crystalsGranted: tx.crystals_granted };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("crystal_balance")
    .eq("id", tx.profile_id)
    .maybeSingle();

  const nextBalance = (profile?.crystal_balance ?? 0) + tx.crystals_granted;

  const { error: balanceError } = await admin
    .from("profiles")
    .update({ crystal_balance: nextBalance })
    .eq("id", tx.profile_id);

  if (balanceError) {
    return { ok: false, error: "Kristal bakiyesi güncellenemedi." };
  }

  await admin
    .from("payment_transactions")
    .update({
      status: "success",
      completed_at: new Date().toISOString(),
    })
    .eq("id", transactionId);

  return { ok: true, crystalsGranted: tx.crystals_granted };
}
