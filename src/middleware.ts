import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  HOME_PATH,
  NFC_FINGERPRINT_COOKIE,
  NFC_SESSION_COOKIE,
  STORAGE_VERIFIED_COOKIE,
  TRUSTED_DEVICE_COOKIE,
  TRUSTED_NFC_COOKIE,
} from "@/lib/nfc/constants";
import {
  getCookiePresence,
  logNfcError,
  logNfcEvent,
  sanitizeRequestHeaders,
} from "@/lib/nfc/error-logger";
import { runSecurityGate } from "@/lib/nfc/middleware-security";

function getServiceClient() {
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
  clearSession: boolean,
  clearTrustedDevice = false
): NextResponse {
  const url = request.nextUrl.clone();
  const isReauth = redirectTo.startsWith("/c/");

  url.pathname = isReauth ? redirectTo.split("?")[0] : redirectTo;
  url.search = isReauth ? "reauth=1" : "";
  const response = NextResponse.redirect(url);

  if (clearSession) {
    response.cookies.set(NFC_SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(NFC_FINGERPRINT_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(STORAGE_VERIFIED_COOKIE, "", { maxAge: 0, path: "/" });
  }

  if (clearTrustedDevice) {
    response.cookies.set(TRUSTED_DEVICE_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(TRUSTED_NFC_COOKIE, "", { maxAge: 0, path: "/" });
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const context = {
    layer: "middleware" as const,
    handler: "middleware",
    pathname: request.nextUrl.pathname,
    method: request.method,
  };

  try {
    const supabase = getServiceClient();
    const gate = await runSecurityGate(request, supabase);

    if (!gate.allowed) {
      const clearSession =
        gate.reason === "session_expired" ||
        gate.reason === "session_missing" ||
        gate.reason === "fingerprint_mismatch" ||
        gate.reason === "nfc_card_inactive" ||
        gate.reason === "device_bound_missing" ||
        gate.reason === "unauthorized_route";

      const clearTrusted = gate.reason === "device_bound_missing";

      return buildDeniedResponse(
        request,
        gate.redirectTo,
        clearSession,
        clearTrusted
      );
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

    return buildDeniedResponse(request, HOME_PATH, true, true);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|se1)$).*)",
  ],
};
