import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  HOME_PATH,
  NFC_FINGERPRINT_COOKIE,
  NFC_SESSION_COOKIE,
  STORAGE_VERIFIED_COOKIE,
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
  clearSession: boolean
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = redirectTo.split("?")[0];
  url.search = "";
  const response = NextResponse.redirect(url);

  if (clearSession) {
    response.cookies.set(NFC_SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(NFC_FINGERPRINT_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(STORAGE_VERIFIED_COOKIE, "", { maxAge: 0, path: "/" });
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
        gate.reason === "unauthorized_route";

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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|se1)$).*)",
  ],
};
