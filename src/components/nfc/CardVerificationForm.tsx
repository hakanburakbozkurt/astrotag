"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { handlePinLogin } from "@/lib/actions/pin-login";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";
import { isPinInputReady, normalizePinInput } from "@/lib/nfc/pin-input";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";

type CardVerificationFormProps = {
  uniqueId: string;
};

export default function CardVerificationForm({
  uniqueId,
}: CardVerificationFormProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardId = uniqueId.trim();
  const pinDigits = useMemo(() => normalizePinInput(pin), [pin]);
  const canSubmit = Boolean(cardId) && isPinInputReady(pinDigits) && !loading;

  useEffect(() => {
    void confirmStorageAccessAction();
  }, []);

  function syncPin(rawValue: string) {
    setPin(normalizePinInput(rawValue).slice(0, 8));
  }

  async function loginAction(pinCode: string) {
    if (!cardId) {
      setError("Kart kimliği bulunamadı. Lütfen NFC etiketinizle tekrar deneyin.");
      return;
    }

    if (!isPinInputReady(pinCode) || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    console.log("--- [DEBUG] CardVerificationForm loginAction client submit ---", {
      cardId,
      pinLength: pinCode.length,
    });

    try {
      alert("Buton tetiklendi!");
      const result = await handlePinLogin({
        uniqueId: cardId,
        pin_code: pinCode,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      navigateAfterNfcAuth(result.redirectTo);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Doğrulama tamamlanamadı."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const fromForm = normalizePinInput(String(formData.get("pin_code") ?? ""));
    const pinCode = fromForm || pinDigits;

    if (fromForm && fromForm !== pinDigits) {
      syncPin(fromForm);
    }

    void loginAction(pinCode);
  }

  return (
    <>
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-400/35 bg-red-950/50 px-4 py-3 text-sm text-red-100"
        >
          {error}
        </div>
      ) : null}

      {!cardId ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-amber-400/35 bg-amber-950/40 px-4 py-3 text-sm text-amber-100"
        >
          Geçersiz kart bağlantısı. NFC etiketinizle tekrar giriş yapın.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label htmlFor="pin_code" className="text-[11px] uppercase tracking-widest text-white/45">
          PIN
        </label>
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
          onInput={(event) => syncPin(event.currentTarget.value)}
          placeholder="••••"
          className={`${authInputClassName} text-center text-2xl font-semibold tracking-[0.45em]`}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className={`${authPrimaryButtonClassName} mt-2`}
        >
          {loading ? "Doğrulanıyor..." : "Giriş Yap"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] text-white/40">
        Kartınıza kayıtlı PIN kodunuz ile giriş yapın.
      </p>
    </>
  );
}
