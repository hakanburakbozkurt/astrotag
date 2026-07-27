"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { updatePasswordAction } from "@/lib/actions/password-reset";
import { getAuthServiceClient } from "@/lib/auth/auth-service.client";
import { AUTH_LOGIN_PATH } from "@/lib/nfc/constants";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";

export default function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void (async () => {
      const supabase = getAuthServiceClient();
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      try {
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }
        } else if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "recovery" | "email",
          });
          if (verifyError) {
            setError(verifyError.message);
            return;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setError("Sıfırlama oturumu oluşturulamadı. Bağlantıyı tekrar deneyin.");
          return;
        }

        setReady(true);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Doğrulama başarısız.");
      }
    })();
  }, [searchParams]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await updatePasswordAction(password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthMobileShell
        title="Şifre Güncellendi"
        subtitle="Yeni şifrenizle giriş yapabilirsiniz."
      >
        <section className="auth-glass-card w-full p-6 text-center sm:p-8">
          <p className="text-sm text-emerald-100">
            Şifreniz başarıyla güncellendi.
          </p>
          <Link href={AUTH_LOGIN_PATH} className={`${authPrimaryButtonClassName} mt-6 inline-flex`}>
            Giriş Yap
          </Link>
        </section>
      </AuthMobileShell>
    );
  }

  return (
    <AuthMobileShell
      title="Yeni Şifre Belirle"
      subtitle="Güvenli bir şifre seçin ve hesabınıza tekrar erişin."
    >
      <section className="auth-glass-card w-full p-6 sm:p-8">
        {!ready ? (
          <p className="text-sm text-white/50">
            {error ?? "Sıfırlama bağlantısı doğrulanıyor…"}
          </p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
            <label className="text-[11px] uppercase tracking-widest text-white/45">
              Yeni Şifre
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={authInputClassName}
            />

            <label className="text-[11px] uppercase tracking-widest text-white/45">
              Yeni Şifre Tekrar
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={authInputClassName}
            />

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-100"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className={authPrimaryButtonClassName}
            >
              {loading ? "Kaydediliyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        )}
      </section>
    </AuthMobileShell>
  );
}
