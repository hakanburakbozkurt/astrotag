import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { resolveAuthCallbackDestination } from "@/lib/auth/resolve-callback-destination.server";
import { AUTH_CALLBACK_PATH, HOME_PATH } from "@/lib/nfc/constants";
import { logNfcError } from "@/lib/nfc/error-logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ROUTE_CTX = { layer: "api" as const, handler: "auth/callback/GET" };

function redirectWithError(origin: string, message: string): NextResponse {
  const url = new URL(HOME_PATH, origin);
  url.searchParams.set("auth_error", message.slice(0, 200));
  return NextResponse.redirect(url);
}

/**
 * Supabase e-posta / PKCE callback — kodu oturuma çevirir, oturum doğrulanınca yönlendirir.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const origin = url.origin;

  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (errorParam) {
    logNfcError(
      ROUTE_CTX,
      new Error(errorDescription ?? errorParam),
      { step: "provider_error" }
    );
    return redirectWithError(origin, errorDescription ?? errorParam);
  }

  const supabase = await createServerSupabaseClient();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = url.searchParams.get("type") as EmailOtpType | null;
  const next =
    url.searchParams.get("next") ?? url.searchParams.get("redirect_to");

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        logNfcError(ROUTE_CTX, error, { step: "exchangeCodeForSession" });
        return redirectWithError(origin, error.message);
      }
    } else if (tokenHash && otpType) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      });
      if (error) {
        logNfcError(ROUTE_CTX, error, { step: "verifyOtp", type: otpType });
        return redirectWithError(origin, error.message);
      }
    } else {
      return redirectWithError(origin, "Doğrulama kodu eksik.");
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      logNfcError(ROUTE_CTX, sessionError, { step: "getSession" });
      return redirectWithError(origin, sessionError.message);
    }

    if (!session?.access_token) {
      logNfcError(
        ROUTE_CTX,
        new Error("getSession: oturum oluşturulamadı"),
        { pathname: AUTH_CALLBACK_PATH }
      );
      return redirectWithError(
        origin,
        "Oturum oluşturulamadı. Lütfen bağlantıyı tekrar deneyin."
      );
    }

    const destination = await resolveAuthCallbackDestination(next);
    return NextResponse.redirect(new URL(destination, origin));
  } catch (error) {
    logNfcError(ROUTE_CTX, error, { pathname: AUTH_CALLBACK_PATH });
    return redirectWithError(
      origin,
      error instanceof Error ? error.message : "Doğrulama tamamlanamadı."
    );
  }
}
