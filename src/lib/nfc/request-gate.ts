import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_CALLBACK_PATH,
  HOME_PATH,
  NFC_FINGERPRINT_COOKIE,
  NFC_PROFILE_COOKIE,
  NFC_SESSION_COOKIE,
  PENDING_NFC_COOKIE,
  STORAGE_VERIFIED_COOKIE,
} from "@/lib/nfc/constants";
import {
  getCookiePresence,
  logNfcError,
  logNfcEvent,
  sanitizeRequestHeaders,
} from "@/lib/nfc/error-logger";
import { runSecurityGate } from "@/lib/nfc/middleware-security";

function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    logNfcEvent(
      "warn",
      { layer: "middleware", handler: "getServiceClient" },
      "Supabase service client yapılandırması eksik",
      {
        hasUrl: Boolean(url),
        hasServiceRoleKey: Boolean(key),
      }
    );
    return null;
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function buildDeniedResponse(
  request: NextRequest,
  redirectTo: string,
  clearSession: boolean
): NextResponse {
  const target = new URL(redirectTo, request.url);

  if (
    target.pathname === request.nextUrl.pathname &&
    target.search === request.nextUrl.search
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(target);

  if (clearSession) {
    response.cookies.set(NFC_SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(NFC_FINGERPRINT_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(NFC_PROFILE_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(STORAGE_VERIFIED_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(PENDING_NFC_COOKIE, "", { maxAge: 0, path: "/" });
  }

  return response;
}

/**
 * Next.js 16 proxy — istek güvenlik kapısı (eski middleware.ts mantığı).
 */
function isAuthCallbackPath(pathname: string): boolean {
  return (
    pathname === AUTH_CALLBACK_PATH ||
    pathname.startsWith(`${AUTH_CALLBACK_PATH}/`)
  );
}

export async function handleProxyRequest(
  request: NextRequest
): Promise<NextResponse> {
  const context = {
    layer: "middleware" as const,
    handler: "proxy",
    pathname: request.nextUrl.pathname,
    method: request.method,
  };

  if (isAuthCallbackPath(request.nextUrl.pathname)) {
    if (request.method !== "GET") {
      return new NextResponse("Method Not Allowed", { status: 405 });
    }
    return NextResponse.next();
  }

  try {
    const supabase = getServiceClient();
    const gate = await runSecurityGate(request, supabase);

    if (!gate.allowed) {
      const pairingRedirect = gate.redirectTo.includes("pair=1");
      const clearSession =
        gate.reason === "session_expired" ||
        gate.reason === "fingerprint_mismatch" ||
        gate.reason === "nfc_card_inactive" ||
        gate.reason === "unauthorized_route" ||
        (gate.reason === "session_missing" && !pairingRedirect);

      return buildDeniedResponse(request, gate.redirectTo, clearSession);
    }

    const response = NextResponse.next();

    if (request.nextUrl.pathname.startsWith("/c/")) {
      response.headers.set("Link", `<${request.nextUrl.pathname}>; rel=prefetch`);
    }

    return response;
  } catch (error) {
    logNfcError(context, error, {
      requestHeaders: sanitizeRequestHeaders(request.headers),
      cookies: getCookiePresence(request.cookies),
      url: request.nextUrl.toString(),
      supabaseConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });

    if (process.env.NODE_ENV === "development") {
      throw error;
    }

    return buildDeniedResponse(request, HOME_PATH, true);
  }
}
