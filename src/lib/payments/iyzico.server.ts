import "server-only";

import { randomUUID } from "crypto";
import {
  formatIyzicoPrice,
  initializeCheckoutForm,
  retrieveCheckoutFormResult,
} from "@/lib/iyzico/client";
import {
  iyzicoCallbackUrl,
  iyzicoCheckoutReturnUrl,
  isIyzicoConfigured,
} from "@/lib/payments/iyzico.config";
import { loadCrystalCheckoutBuyer } from "@/lib/payments/iyzico-buyer.server";
import {
  assertDevCompleteAllowed,
  assertPaymentCallbackAuthorized,
  assertProductionPaymentsConfigured,
  PaymentCompletionForbiddenError,
} from "@/lib/payments/payment-completion-auth.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type InitCrystalCheckoutResult =
  | {
      ok: true;
      transactionId: string;
      checkoutUrl: string;
      devMode?: boolean;
    }
  | { ok: false; error: string };

type PaymentTransactionRow = {
  id: string;
  profile_id: string;
  crystals_granted: number;
  status: string;
  iyzico_conversation_id: string | null;
  raw_response: unknown;
};

type CompleteCrystalPurchaseOptions = {
  iyzicoPaymentId?: string | null;
  rawResponse?: unknown;
  markFailed?: boolean;
};

function parseCheckoutToken(rawResponse: unknown): string | null {
  if (!rawResponse || typeof rawResponse !== "object" || Array.isArray(rawResponse)) {
    return null;
  }

  const token = (rawResponse as Record<string, unknown>).checkoutToken;
  return typeof token === "string" && token.trim() ? token.trim() : null;
}

async function findPendingTransactionByCheckoutToken(
  checkoutToken: string
): Promise<PaymentTransactionRow | null> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("payment_transactions")
    .select("id, profile_id, crystals_granted, status, iyzico_conversation_id, raw_response")
    .eq("status", "pending")
    .contains("raw_response", { checkoutToken })
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PaymentTransactionRow;
}

/**
 * İyzico ödeme başlatma.
 * Sandbox anahtarları yoksa geliştirme modunda simüle edilmiş checkout URL döner.
 */
export async function initCrystalCheckout(
  profileId: string,
  packageId: string,
  options?: { clientIp?: string }
): Promise<InitCrystalCheckoutResult> {
  try {
    assertProductionPaymentsConfigured();
  } catch (error) {
    const message =
      error instanceof PaymentCompletionForbiddenError
        ? error.message
        : "Ödeme sistemi yapılandırılmamış.";
    return { ok: false, error: message };
  }

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
  const price = formatIyzicoPrice(Number(pkg.price_try));

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
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Ödeme sistemi yapılandırılmamış." };
    }

    const devCheckoutUrl = `/api/payments/iyzico/dev-complete?tx=${transactionId}`;
    return {
      ok: true,
      transactionId,
      checkoutUrl: devCheckoutUrl,
      devMode: true,
    };
  }

  const buyer = await loadCrystalCheckoutBuyer(profileId, options?.clientIp ?? "127.0.0.1");
  if (!buyer) {
    return { ok: false, error: "Ödeme için profil bilgileri alınamadı." };
  }

  const address = `${buyer.city}, Türkiye`;

  let initializeResponse;
  try {
    initializeResponse = await initializeCheckoutForm({
    locale: "tr",
    conversationId,
    price,
    paidPrice: price,
    currency: "TRY",
    basketId: `crystal-${pkg.id}`,
    paymentGroup: "PRODUCT",
    callbackUrl: iyzicoCallbackUrl(),
    enabledInstallments: [1],
    buyer: {
      id: buyer.profileId,
      name: buyer.name,
      surname: buyer.surname,
      gsmNumber: buyer.gsmNumber,
      email: buyer.email,
      identityNumber: "11111111111",
      registrationAddress: address,
      ip: buyer.ip,
      city: buyer.city,
      country: "Turkey",
    },
    shippingAddress: {
      contactName: `${buyer.name} ${buyer.surname}`.trim(),
      city: buyer.city,
      country: "Turkey",
      address,
    },
    billingAddress: {
      contactName: `${buyer.name} ${buyer.surname}`.trim(),
      city: buyer.city,
      country: "Turkey",
      address,
    },
    basketItems: [
      {
        id: pkg.id,
        name: pkg.title,
        category1: "Digital",
        itemType: "VIRTUAL",
        price,
      },
    ],
    });
  } catch (error) {
    console.error("[initCrystalCheckout] iyzico initialize failed:", error);
    await admin
      .from("payment_transactions")
      .update({
        status: "failed",
        raw_response: {
          error: error instanceof Error ? error.message : "initialize_failed",
        },
        completed_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    return { ok: false, error: "İyzico ödeme oturumu başlatılamadı." };
  }

  if (initializeResponse.status !== "success" || !initializeResponse.token) {
    await admin
      .from("payment_transactions")
      .update({
        status: "failed",
        raw_response: initializeResponse,
        completed_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    return {
      ok: false,
      error:
        initializeResponse.errorMessage ??
        "İyzico ödeme oturumu başlatılamadı.",
    };
  }

  const checkoutUrl =
    initializeResponse.paymentPageUrl ??
    iyzicoCheckoutReturnUrl(transactionId);

  await admin
    .from("payment_transactions")
    .update({
      raw_response: {
        checkoutToken: initializeResponse.token,
        initialize: initializeResponse,
      },
    })
    .eq("id", transactionId);

  return {
    ok: true,
    transactionId,
    checkoutUrl,
  };
}

export async function completeCrystalPurchaseFromDev(
  transactionId: string
): Promise<{ ok: boolean; crystalsGranted?: number; error?: string }> {
  try {
    assertDevCompleteAllowed();
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof PaymentCompletionForbiddenError
          ? error.message
          : "Dev-complete izni yok.",
    };
  }

  return completeCrystalPurchase(transactionId, {
    iyzicoPaymentId: `dev-${transactionId.slice(0, 8)}`,
    rawResponse: { mode: "dev-complete" },
  });
}

export async function completeCrystalPurchaseFromCallback(
  transactionId: string,
  signature: string | null | undefined
): Promise<{ ok: boolean; crystalsGranted?: number; error?: string }> {
  try {
    assertPaymentCallbackAuthorized(transactionId, signature);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof PaymentCompletionForbiddenError
          ? error.message
          : "Ödeme doğrulaması başarısız.",
    };
  }

  return completeCrystalPurchase(transactionId);
}

export async function completeCrystalPurchaseFromIyzicoToken(
  checkoutToken: string
): Promise<{ ok: boolean; crystalsGranted?: number; error?: string; transactionId?: string }> {
  const tx = await findPendingTransactionByCheckoutToken(checkoutToken);
  if (!tx) {
    return { ok: false, error: "Ödeme oturumu bulunamadı." };
  }

  const retrieveResponse = await retrieveCheckoutFormResult({
    locale: "tr",
    conversationId: tx.iyzico_conversation_id ?? `astrotag-${tx.id.slice(0, 8)}`,
    token: checkoutToken,
  });

  if (retrieveResponse.paymentStatus !== "SUCCESS") {
    await markTransactionFailed(tx.id, retrieveResponse);
    return {
      ok: false,
      error:
        retrieveResponse.errorMessage ??
        "Ödeme tamamlanmadı veya doğrulanamadı.",
      transactionId: tx.id,
    };
  }

  return completeCrystalPurchase(tx.id, {
    iyzicoPaymentId: retrieveResponse.paymentId ?? checkoutToken,
    rawResponse: retrieveResponse,
  });
}

export async function finalizeCrystalPurchaseReturn(
  transactionId: string
): Promise<{ ok: boolean; crystalsGranted?: number; error?: string }> {
  const admin = createServiceRoleClient();
  const { data: tx, error } = await admin
    .from("payment_transactions")
    .select("id, profile_id, crystals_granted, status, iyzico_conversation_id, raw_response")
    .eq("id", transactionId)
    .maybeSingle();

  if (error || !tx) {
    return { ok: false, error: "Ödeme kaydı bulunamadı." };
  }

  if (tx.status === "success") {
    return { ok: true, crystalsGranted: tx.crystals_granted };
  }

  const checkoutToken = parseCheckoutToken(tx.raw_response);
  if (!checkoutToken) {
    return { ok: false, error: "İyzico oturum bilgisi eksik." };
  }

  return completeCrystalPurchaseFromIyzicoToken(checkoutToken);
}

async function markTransactionFailed(
  transactionId: string,
  rawResponse: unknown
): Promise<void> {
  const admin = createServiceRoleClient();
  await admin
    .from("payment_transactions")
    .update({
      status: "failed",
      raw_response: rawResponse,
      completed_at: new Date().toISOString(),
    })
    .eq("id", transactionId);
}

async function completeCrystalPurchase(
  transactionId: string,
  options: CompleteCrystalPurchaseOptions = {}
): Promise<{ ok: boolean; crystalsGranted?: number; error?: string; transactionId?: string }> {
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
    return { ok: true, crystalsGranted: tx.crystals_granted, transactionId: tx.id };
  }

  if (options.markFailed) {
    await markTransactionFailed(transactionId, options.rawResponse ?? null);
    return { ok: false, error: "Ödeme başarısız.", transactionId: tx.id };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("crystal_balance, user_id")
    .eq("id", tx.profile_id)
    .maybeSingle();

  if (!profile) {
    return { ok: false, error: "Profil bulunamadı." };
  }

  const nextBalance = (profile.crystal_balance ?? 0) + tx.crystals_granted;

  const { error: balanceError } = await admin
    .from("profiles")
    .update({ crystal_balance: nextBalance })
    .eq("id", tx.profile_id);

  if (balanceError) {
    return { ok: false, error: "Kristal bakiyesi güncellenemedi." };
  }

  if (profile.user_id) {
    const { data: existingLedger } = await admin
      .from("crystal_ledger")
      .select("id")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (!existingLedger) {
      const { error: ledgerError } = await admin.from("crystal_ledger").insert({
        user_id: profile.user_id,
        amount: tx.crystals_granted,
        type: "purchase",
        transaction_id: transactionId,
      });

      if (ledgerError) {
        console.error("[completeCrystalPurchase] ledger insert failed:", ledgerError.message);
      }
    }
  }

  const { data: existingTx } = await admin
    .from("payment_transactions")
    .select("raw_response")
    .eq("id", transactionId)
    .maybeSingle();

  const previousRaw =
    existingTx?.raw_response &&
    typeof existingTx.raw_response === "object" &&
    !Array.isArray(existingTx.raw_response)
      ? (existingTx.raw_response as Record<string, unknown>)
      : {};

  await admin
    .from("payment_transactions")
    .update({
      status: "success",
      iyzico_payment_id: options.iyzicoPaymentId ?? null,
      raw_response: {
        ...previousRaw,
        retrieve: options.rawResponse ?? null,
      },
      completed_at: new Date().toISOString(),
    })
    .eq("id", transactionId);

  return { ok: true, crystalsGranted: tx.crystals_granted, transactionId: tx.id };
}
