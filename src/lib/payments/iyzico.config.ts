export const IYZICO_API_KEY = process.env.IYZICO_API_KEY?.trim() ?? "";
export const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY?.trim() ?? "";
export const IYZICO_BASE_URL =
  process.env.IYZICO_BASE_URL?.trim() ?? "https://sandbox-api.iyzipay.com";

export const NEXT_PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "http://localhost:3000";

export function isIyzicoConfigured(): boolean {
  return Boolean(IYZICO_API_KEY && IYZICO_SECRET_KEY);
}

export function iyzicoCallbackUrl(): string {
  return `${NEXT_PUBLIC_SITE_URL}/api/payments/iyzico/callback`;
}

export function iyzicoCheckoutReturnUrl(transactionId: string): string {
  return `${NEXT_PUBLIC_SITE_URL}/dashboard/profile?crystalPurchase=${transactionId}`;
}
