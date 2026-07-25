import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { finalizeExpertEmailAuth } from "@/lib/expert/expert-auth.server";
import {
  EXPERT_AUTH_CALLBACK_PATH,
  EXPERT_LOGIN_PATH,
} from "@/lib/expert/expert-paths";
import { logNfcError } from "@/lib/nfc/error-logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ROUTE_CTX = { layer: "api" as const, handler: "auth/expert/callback/GET" };

function redirectWithError(origin: string, message: string): NextResponse {
  const url = new URL(EXPERT_LOGIN_PATH, origin);
  url.searchParams.set("auth_error", message.slice(0, 200));
  return NextResponse.redirect(url);
}

/**
 * Uzman platformu — magic link / PKCE callback.
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

    const authUserId = session?.user?.id;
    if (!authUserId) {
      logNfcError(
        ROUTE_CTX,
        new Error("getSession: oturum oluşturulamadı"),
        { pathname: EXPERT_AUTH_CALLBACK_PATH }
      );
      return redirectWithError(
        origin,
        "Oturum oluşturulamadı. Lütfen bağlantıyı tekrar deneyin."
      );
    }

    const result = await finalizeExpertEmailAuth(authUserId);

    if (!result.ok) {
      return redirectWithError(origin, result.error);
    }

    return NextResponse.redirect(new URL(result.redirectTo, origin));
  } catch (error) {
    logNfcError(ROUTE_CTX, error, { pathname: EXPERT_AUTH_CALLBACK_PATH });
    return redirectWithError(
      origin,
      error instanceof Error ? error.message : "Doğrulama tamamlanamadı."
    );
  }
}
