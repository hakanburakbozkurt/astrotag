"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import {
  authInputClassName,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
} from "@/components/auth/auth-field-styles";
import {
  resendEmailOtpAction,
  verifyEmailOtpAction,
} from "@/lib/actions/auth-email";
import { AUTH_LOGIN_PATH } from "@/lib/nfc/constants";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";

function VerifyOtpContent() {
  const { safeReplace } = useSafeRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const uniqueId = searchParams.get("nfc")?.trim() ?? "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!email) {
    return (
      <AuthMobileShell
        title="Eksik bilgi"
        subtitle="Doğrulama bağlantısı geçersiz. Lütfen kayıt akışını tekrar başlatın."
      >
        <button
          type="button"
          onClick={() => void safeReplace(AUTH_LOGIN_PATH)}
          className={authSecondaryButtonClassName}
        >
          Giriş sayfası
        </button>
      </AuthMobileShell>
    );
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const result = await verifyEmailOtpAction({
        email,
        otp,
        uniqueId: uniqueId || undefined,
        device: {
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          userAgent: navigator.userAgent,
        },
      });

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      navigateAfterNfcAuth(result.redirectTo);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Doğrulama başarısız.");
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setInfo(null);

    const result = await resendEmailOtpAction(email, uniqueId || undefined);
    setResending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setInfo("Yeni kod e-postanıza gönderildi.");
  }

  return (
    <AuthMobileShell
      title="Kodu Doğrula"
      subtitle={`${email} adresine gönderilen 6 haneli kodu girin.`}
    >
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={6}
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="000000"
          className={`${authInputClassName} text-center text-2xl font-semibold tracking-[0.45em]`}
        />

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className={authPrimaryButtonClassName}
        >
          {loading ? "Doğrulanıyor..." : "Doğrula ve Devam Et"}
        </button>

        <button
          type="button"
          disabled={resending}
          onClick={() => void handleResend()}
          className={authSecondaryButtonClassName}
        >
          {resending ? "Gönderiliyor..." : "Kodu tekrar gönder"}
        </button>

        <button
          type="button"
          onClick={() => void safeReplace(AUTH_LOGIN_PATH)}
          className="text-center text-[10px] uppercase tracking-widest text-white/40 hover:text-white/60"
        >
          Giriş ekranına dön
        </button>
      </form>

      {info ? (
        <p className="mt-4 text-center text-sm text-amber-200/80">{info}</p>
      ) : null}
      {error ? (
        <p className="mt-4 text-center text-sm text-red-300/90">{error}</p>
      ) : null}
    </AuthMobileShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <AuthMobileShell title="Yükleniyor..." subtitle="Doğrulama hazırlanıyor.">
          <div className="h-12 animate-pulse rounded-2xl bg-white/10" />
        </AuthMobileShell>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
