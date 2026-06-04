"use client";

import { useState } from "react";
import { safeRouterPush, useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import { startNfcEmailAuthAction } from "@/lib/actions/nfc-email-auth";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";

type NfcLoginFormProps = {
  uniqueId: string;
};

export default function NfcLoginForm({ uniqueId }: NfcLoginFormProps) {
  const { router } = useSafeRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await startNfcEmailAuthAction({
        email,
        password,
        confirmPassword,
        uniqueId,
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

      if (result.skipOtp) {
        navigateAfterNfcAuth(result.redirectTo);
        return;
      }

      await safeRouterPush(router, result.redirectTo);
    } catch (cause) {
      console.error("[NfcLoginForm]", cause);
      setError(
        cause instanceof Error ? cause.message : "İşlem tamamlanamadı."
      );
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0f172a]/90 p-6 backdrop-blur-xl sm:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-[11px] uppercase tracking-widest text-white/45">
          E-posta
        </label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@email.com"
          className={authInputClassName}
        />

        <label className="text-[11px] uppercase tracking-widest text-white/45">
          Şifre
        </label>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="En az 8 karakter"
          className={authInputClassName}
        />

        <label className="text-[11px] uppercase tracking-widest text-white/45">
          Şifre tekrar
        </label>
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Şifrenizi tekrar girin"
          className={authInputClassName}
        />

        <button
          type="submit"
          disabled={loading}
          className={`${authPrimaryButtonClassName} mt-2`}
        >
          {loading ? "İşleniyor..." : "Kaydol / Giriş Yap"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-white/40">
        Yeni hesaplarda e-postanıza 6 haneli doğrulama kodu gönderilir.
      </p>

      {error ? (
        <p className="mt-4 text-center text-sm text-red-300/90">{error}</p>
      ) : null}
    </div>
  );
}
