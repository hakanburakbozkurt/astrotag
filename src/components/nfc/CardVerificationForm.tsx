"use client";

import { useEffect, useRef, useState } from "react";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { handlePinLogin } from "@/lib/actions/pin-login";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";

type CardVerificationFormProps = {
  uniqueId: string;
};

export default function CardVerificationForm({
  uniqueId,
}: CardVerificationFormProps) {
  const [birthDate, setBirthDate] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    void confirmStorageAccessAction();
  }, []);

  async function submitVerification() {
    if (isSubmittingRef.current || loading || !uniqueId) {
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await handlePinLogin({
        uniqueId,
        pin,
        birthDate,
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
      isSubmittingRef.current = false;
      setLoading(false);
    }
  }

  function blockNativeSubmit(event: React.FormEvent) {
    event.preventDefault();
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

      <form onSubmit={blockNativeSubmit} className="flex flex-col gap-4" noValidate>
        <label className="text-[11px] uppercase tracking-widest text-white/45">
          Doğum Tarihi
        </label>
        <input
          type="date"
          name="birthDate"
          required
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          className={authInputClassName}
        />

        <label className="text-[11px] uppercase tracking-widest text-white/45">
          PIN
        </label>
        <input
          type="password"
          name="pin"
          inputMode="numeric"
          autoComplete="off"
          required
          minLength={4}
          maxLength={8}
          value={pin}
          onChange={(event) =>
            setPin(event.target.value.replace(/\D/g, "").slice(0, 8))
          }
          placeholder="••••"
          className={`${authInputClassName} text-center text-2xl font-semibold tracking-[0.45em]`}
        />

        <button
          type="button"
          disabled={loading || !birthDate || pin.length < 4}
          onClick={() => void submitVerification()}
          className={`${authPrimaryButtonClassName} mt-2`}
        >
          {loading ? "Doğrulanıyor..." : "Doğrula ve Giriş Yap"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] text-white/40">
        Kartınıza kayıtlı doğum tarihi ve PIN ile giriş yapın.
      </p>
    </>
  );
}
