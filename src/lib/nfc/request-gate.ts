import { NextResponse, type NextRequest } from "next/server";
import { isAuthFormPath } from "@/lib/nfc/auth-paths";
import { AUTH_LOGIN_PATH, HOME_PATH, STORAGE_VERIFIED_COOKIE } from "@/lib/nfc/constants";
import { runSecurityGate } from "@/lib/nfc/middleware-security";
import { createSupabaseProxyClient } from "@/lib/supabase/proxy-client";
import { EXPERT_AUTH_CALLBACK_PATH } from "@/lib/expert/expert-paths";
import { AUTH_CALLBACK_PATH } from "@/lib/nfc/constants";

function isAuthCallbackPath(pathname: string): boolean {
  return (
    pathname === AUTH_CALLBACK_PATH ||
    pathname.startsWith(`${AUTH_CALLBACK_PATH}/`) ||
    pathname === EXPERT_AUTH_CALLBACK_PATH ||
    pathname.startsWith(`${EXPERT_AUTH_CALLBACK_PATH}/`)
  );
}

function buildDeniedResponse(
  request: NextRequest,
  redirectTo: string
): NextResponse {
  const target = new URL(redirectTo, request.url);

  if (
    target.pathname === request.nextUrl.pathname &&
    target.search === request.nextUrl.search
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(target);
}

/**
 * Next.js 16 proxy — Supabase Auth kapısı.
 */
export async function handleProxyRequest(
  request: NextRequest
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  if (isAuthCallbackPath(pathname)) {
    if (request.method !== "GET") {
      return new NextResponse("Method Not Allowed", { status: 405 });
    }
    return NextResponse.next();
  }

  const { supabase, getResponse } = createSupabaseProxyClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const gate = await runSecurityGate(request, user);

  if (!gate.allowed) {
    const authFormRedirect = isAuthFormPath(
      new URL(gate.redirectTo, request.url).pathname
    );

    const response = buildDeniedResponse(request, gate.redirectTo);

    if (gate.reason === "session_missing" && !authFormRedirect) {
      response.cookies.set(STORAGE_VERIFIED_COOKIE, "", { maxAge: 0, path: "/" });
    }

    response.headers.set("x-astrotag-gate", `deny:${gate.reason}`);
    return response;
  }

  const response = getResponse();
  response.headers.set("x-astrotag-gate", "allow");
  return response;
}
