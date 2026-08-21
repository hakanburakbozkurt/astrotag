import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { IYZICO_SECRET_KEY, isIyzicoConfigured } from "@/lib/payments/iyzico.config";

export class PaymentCompletionForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentCompletionForbiddenError";
  }
}

export function assertProductionPaymentsConfigured(): void {
  if (process.env.NODE_ENV === "production" && !isIyzicoConfigured()) {
    throw new PaymentCompletionForbiddenError(
      "Production ortamında İyzico yapılandırması zorunludur."
    );
  }
}

export function assertDevCompleteAllowed(): void {
  if (process.env.NODE_ENV === "production") {
    throw new PaymentCompletionForbiddenError(
      "Dev-complete ödeme simülasyonu production ortamında devre dışıdır."
    );
  }

  if (isIyzicoConfigured()) {
    throw new PaymentCompletionForbiddenError(
      "İyzico yapılandırıldığında dev-complete kullanılamaz."
    );
  }
}

function resolveCallbackSecret(): string {
  return (
    process.env.PAYMENT_CALLBACK_SECRET?.trim() ||
    IYZICO_SECRET_KEY.trim()
  );
}

export function buildPaymentCallbackSignature(transactionId: string): string {
  const secret = resolveCallbackSecret();
  if (!secret) {
    throw new PaymentCompletionForbiddenError(
      "Ödeme callback gizli anahtarı yapılandırılmamış."
    );
  }

  return createHmac("sha256", secret).update(transactionId).digest("hex");
}

export function verifyPaymentCallbackSignature(
  transactionId: string,
  signature: string | null | undefined
): boolean {
  const secret = resolveCallbackSecret();
  const normalized = signature?.trim();

  if (!secret || !normalized) {
    return false;
  }

  try {
    const expected = buildPaymentCallbackSignature(transactionId);
    const expectedBuffer = Buffer.from(expected, "utf8");
    const providedBuffer = Buffer.from(normalized, "utf8");

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

export function assertPaymentCallbackAuthorized(
  transactionId: string,
  signature: string | null | undefined
): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (!verifyPaymentCallbackSignature(transactionId, signature)) {
    throw new PaymentCompletionForbiddenError("Geçersiz ödeme callback imzası.");
  }
}
