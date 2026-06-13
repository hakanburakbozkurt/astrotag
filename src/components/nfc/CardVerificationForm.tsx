"use client";

import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { handlePinLogin as handlePinLoginAction } from "@/lib/actions/pin-login";
import { isPinInputReady, normalizePinInput } from "@/lib/nfc/pin-input";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";

type CardVerificationFormProps = {
  uniqueId: string;
};

function AuthFormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-glass-field">
      <label htmlFor={id} className="auth-glass-label">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function CardVerificationForm({
  uniqueId,
}: CardVerificationFormProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardId = uniqueId.trim();
  const pinDigits = useMemo(() => normalizePinInput(pin), [pin]);
  const canSubmit = Boolean(cardId) && isPinInputReady(pinDigits) && !loading;

  function syncPin(rawValue: string) {
    setPin(normalizePinInput(rawValue).slice(0, 8));
  }

  async function handlePinLogin() {
    if (!cardId) {
      setError("Kart kimliği bulunamadı. Lütfen NFC etiketinizle tekrar deneyin.");
      return;
    }

    if (!isPinInputReady(pinDigits)) {
      setError("PIN en az 4 haneli olmalıdır.");
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await handlePinLoginAction({
        uniqueId: cardId,
        pin_code: pinDigits,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      navigateAfterNfcAuth(result.redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handlePinLogin();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid w-full grid-cols-1 gap-5"
      noValidate
    >
      {!cardId ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-400/35 bg-amber-950/40 px-4 py-3 text-sm text-amber-100"
        >
          Geçersiz kart bağlantısı. NFC etiketinizle tekrar giriş yapın.
        </div>
      ) : null}

      <AuthFormField id="pin_code" label="PIN Kodu">
        <input
          id="pin_code"
          type="password"
          name="pin_code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          minLength={4}
          maxLength={8}
          value={pin}
          onChange={(event) => syncPin(event.target.value)}
          placeholder="••••"
          disabled={loading || !cardId}
          className="auth-glass-input text-center text-2xl font-semibold tracking-[0.45em]"
        />
      </AuthFormField>

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
        className="auth-glass-submit"
      >
        {loading ? "Doğrulanıyor..." : "Giriş Yap"}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-white/40">
        Kartınıza kayıtlı PIN kodunuz ile giriş yapın.
      </p>
    </form>
  );
}
