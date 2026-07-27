"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordResetAction } from "@/lib/actions/password-reset";
import { AUTH_LOGIN_PATH } from "@/lib/nfc/constants";
import {
  authInputClassName,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
} from "@/components/auth/auth-field-styles";

type ForgotPasswordFormProps = {
  initialEmail?: string;
  compact?: boolean;
};

export default function ForgotPasswordForm({
  initialEmail = "",
  compact = false,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await requestPasswordResetAction(email.trim());

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className={compact ? "space-y-3 text-center" : "space-y-4 text-center"}>
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
          Şifre sıfırlama bağlantısı{" "}
          <span className="font-medium text-white">{email.trim().toLowerCase()}</span>{" "}
          adresine gönderildi. Bağlantı kısa süre içinde geçerliliğini yitirir.
        </p>
        {!compact ? (
          <Link href={AUTH_LOGIN_PATH} className={authSecondaryButtonClassName}>
            Giriş sayfasına dön
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={compact ? "space-y-3" : "space-y-4"}
      noValidate
    >
      {!compact ? (
        <p className="text-sm text-white/55">
          Kayıtlı e-posta adresinize güvenli bir sıfırlama bağlantısı gönderilir.
        </p>
      ) : null}

      <label className="text-[11px] uppercase tracking-widest text-white/45">
        E-posta Adresi
      </label>
      <input
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="ornek@astrotag.app"
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
        disabled={loading || !email.trim()}
        className={authPrimaryButtonClassName}
      >
        {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
      </button>
    </form>
  );
}
