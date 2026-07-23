"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { loginExpertAction } from "@/lib/actions/expert-auth";
import {
  formatExpertCodeInput,
  isValidExpertCode,
} from "@/lib/expert/expert-codes.shared";
import { EXPERT_REGISTER_PATH } from "@/lib/expert/expert-paths";
import { isPinInputReady, normalizePinInput } from "@/lib/nfc/pin-input";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";
import { recordClientLastLogin } from "@/lib/nfc/last-login-persist.client";
import WhatsAppRecoveryLink from "@/components/support/WhatsAppRecoveryLink";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";

export default function ExpertLoginForm() {
  const [expertCode, setExpertCode] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedCode = useMemo(() => formatExpertCodeInput(expertCode), [expertCode]);
  const pinDigits = useMemo(() => normalizePinInput(pin), [pin]);
  const canSubmit =
    isValidExpertCode(normalizedCode) && isPinInputReady(pinDigits) && !loading;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginExpertAction({
        expertCode: normalizedCode,
        pin: pinDigits,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      recordClientLastLogin();
      navigateAfterNfcAuth(result.redirectTo);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4" noValidate>
      <label className="text-[11px] uppercase tracking-widest text-white/45">
        Uzman Kodu
      </label>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="username"
        required
        maxLength={8}
        value={expertCode}
        onChange={(event) => setExpertCode(formatExpertCodeInput(event.target.value))}
        placeholder="12345678"
        className={`${authInputClassName} text-center font-mono tracking-[0.35em]`}
      />

      <label className="text-[11px] uppercase tracking-widest text-white/45">
        PIN
      </label>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        required
        minLength={4}
        maxLength={8}
        value={pin}
        onChange={(event) =>
          setPin(normalizePinInput(event.target.value).slice(0, 8))
        }
        placeholder="••••"
        className={`${authInputClassName} text-center text-xl tracking-[0.45em]`}
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
        disabled={!canSubmit}
        className={`${authPrimaryButtonClassName} mt-2`}
      >
        {loading ? "Doğrulanıyor..." : "Giriş Yap"}
      </button>

      <WhatsAppRecoveryLink
        context={{ kind: "expert", expertCode: normalizedCode || "00000000" }}
        label="Şifremi Unuttum"
      />

      <p className="text-center text-[11px] text-white/40">
        PIN sıfırlama yalnızca WhatsApp destek hattı üzerinden yapılır.
      </p>

      <p className="mt-2 text-center text-[11px]">
        <Link
          href={EXPERT_REGISTER_PATH}
          className="font-medium text-amber-200/90 underline-offset-2 hover:underline"
        >
          Davet kodunuz var mı? Kayıt Ol
        </Link>
      </p>
    </form>
  );
}
