import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthFormPath } from "@/lib/nfc/auth-paths";
import {
  AUTH_CALLBACK_PATH,
  HOME_PATH,
  NFC_FINGERPRINT_COOKIE,
  NFC_PROFILE_COOKIE,
  NFC_SESSION_COOKIE,
  PENDING_NFC_COOKIE,
  POST_AUTH_RETURN_TO_COOKIE,
  PROFILE_EDIT_MODE_COOKIE,
  STORAGE_VERIFIED_COOKIE,
} from "@/lib/nfc/constants";
import {
  getCookiePresence,
  logNfcError,
  logNfcEvent,
  sanitizeRequestHeaders,
} from "@/lib/nfc/error-logger";
import { runSecurityGate } from "@/lib/nfc/middleware-security";
import { extractRootUniqueId } from "@/lib/nfc/card-paths";

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
    response.cookies.set(PROFILE_EDIT_MODE_COOKIE, "", { maxAge: 0, path: "/" });
    response.cookies.set(POST_AUTH_RETURN_TO_COOKIE, "", { maxAge: 0, path: "/" });
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
  const pathname = request.nextUrl.pathname;
  const context = {
    layer: "middleware" as const,
    handler: "proxy",
    pathname,
    method: request.method,
  };

  if (pathname.startsWith("/c/") || pathname === "/c") {
    console.log("[proxy] /c/ isteği alındı:", {
      pathname,
      search: request.nextUrl.search,
      method: request.method,
      url: request.nextUrl.toString(),
    });
  }

  const rootNfcId = extractRootUniqueId(pathname);
  if (rootNfcId) {
    console.log("[proxy] NFC kök kart rotası alındı:", {
      pathname,
      nfc_id: rootNfcId,
      search: request.nextUrl.search,
      sessionCookie: Boolean(request.cookies.get(NFC_SESSION_COOKIE)?.value),
    });
  }

  if (isAuthCallbackPath(pathname)) {
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
      const authFormRedirect = isAuthFormPath(
        new URL(gate.redirectTo, request.url).pathname
      );
      const clearSession =
        gate.reason === "session_expired" ||
        gate.reason === "session_idle_expired" ||
        gate.reason === "unauthorized_route" ||
        (gate.reason === "session_missing" && !pairingRedirect && !authFormRedirect);

      if (pathname.startsWith("/c/") || pathname === "/c" || rootNfcId) {
        console.warn("[proxy] NFC isteği gate tarafından reddedildi:", {
          pathname,
          nfc_id: rootNfcId,
          reason: gate.reason,
          redirectTo: gate.redirectTo,
          clearSession,
        });
      }

      const response = buildDeniedResponse(request, gate.redirectTo, clearSession);
      response.headers.set("x-astrotag-gate", `deny:${gate.reason}`);
      return response;
    }

    const response = NextResponse.next();
    response.headers.set("x-astrotag-gate", "allow");

    if (pathname.startsWith("/c/") || rootNfcId) {
      console.log("[proxy] NFC isteği gate geçti:", {
        pathname,
        nfc_id: rootNfcId,
      });
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
