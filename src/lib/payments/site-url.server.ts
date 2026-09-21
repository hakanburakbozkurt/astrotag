import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service";

export const PRODUCTION_SITE_URL = "https://astrotag.app";

function normalizeSiteUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function isLocalhostUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return url.includes("localhost") || url.includes("127.0.0.1");
  }
}

function resolveOriginFromHeaders(
  requestOrHeaders?: Request | Headers
): string | null {
  if (!requestOrHeaders) {
    return null;
  }

  const headerBag =
    requestOrHeaders instanceof Request ? requestOrHeaders.headers : requestOrHeaders;

  const forwardedHost = headerBag.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headerBag.get("host")?.trim();

  if (!host) {
    return null;
  }

  const forwardedProto = headerBag.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwardedProto ??
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return normalizeSiteUrl(`${proto}://${host}`);
}

/**
 * Kamuya açık site kökü — İyzico callback/return ve ödeme sonrası redirect için.
 * Öncelik: geçerli NEXT_PUBLIC_SITE_URL → istek host'u → VERCEL_URL → prod fallback.
 */
export function resolvePublicSiteUrl(
  requestOrHeaders?: Request | Headers
): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (
    fromEnv &&
    !(process.env.NODE_ENV === "production" && isLocalhostUrl(fromEnv))
  ) {
    return normalizeSiteUrl(fromEnv);
  }

  const fromRequest = resolveOriginFromHeaders(requestOrHeaders);
  if (fromRequest && !(process.env.NODE_ENV === "production" && isLocalhostUrl(fromRequest))) {
    return fromRequest;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return normalizeSiteUrl(`https://${vercelUrl}`);
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }

  return "http://localhost:3000";
}

export function buildAppUrl(path: string, baseUrl?: string): string {
  const base = normalizeSiteUrl(baseUrl ?? resolvePublicSiteUrl());
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function iyzicoCallbackUrl(siteBaseUrl?: string): string {
  return buildAppUrl("/api/payments/iyzico/callback", siteBaseUrl);
}

export function iyzicoCheckoutReturnUrl(
  transactionId: string,
  siteBaseUrl?: string
): string {
  return buildAppUrl(
    `/api/payments/iyzico/return?tx=${encodeURIComponent(transactionId)}`,
    siteBaseUrl
  );
}

export function parseStoredPaymentSiteBaseUrl(rawResponse: unknown): string | null {
  if (!rawResponse || typeof rawResponse !== "object" || Array.isArray(rawResponse)) {
    return null;
  }

  const siteBaseUrl = (rawResponse as Record<string, unknown>).siteBaseUrl;
  return typeof siteBaseUrl === "string" && siteBaseUrl.trim()
    ? normalizeSiteUrl(siteBaseUrl)
    : null;
}

export async function resolvePaymentRedirectOrigin(
  request: Request,
  transactionId?: string | null
): Promise<string> {
  if (transactionId) {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("payment_transactions")
      .select("raw_response")
      .eq("id", transactionId)
      .maybeSingle();

    const stored = parseStoredPaymentSiteBaseUrl(data?.raw_response);
    if (stored) {
      return stored;
    }
  }

  return resolvePublicSiteUrl(request);
}

export function buildCrystalWalletRedirectUrl(input: {
  baseUrl: string;
  success: boolean;
  granted?: number;
  transactionId?: string;
}): string {
  const params = new URLSearchParams();

  if (input.success) {
    params.set("crystalSuccess", "1");
    if (input.granted !== undefined) {
      params.set("granted", String(input.granted));
    }
  } else {
    params.set("crystalError", "1");
    if (input.transactionId) {
      params.set("tx", input.transactionId);
    }
  }

  return buildAppUrl(`/dashboard?${params.toString()}`, input.baseUrl);
}
