"use client";

import { FormEvent, useMemo, useState } from "react";
import { handlePinLogin as handlePinLoginAction } from "@/lib/actions/pin-login";
import { authInputClassName } from "@/components/auth/auth-field-styles";
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

  function syncPin(rawValue: string) {
    setPin(normalizePinInput(rawValue).slice(0, 8));
  }

  async function handlePinLogin() {
    console.log("--- [DEBUG] handlePinLogin fonksiyonuna girildi ---");

    try {
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

      console.log("--- [DEBUG] handlePinLogin server action cagriliyor ---", {
        cardId,
        pinLength: pinDigits.length,
      });

      const result = await handlePinLoginAction({
        uniqueId: cardId,
        pin_code: pinDigits,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      navigateAfterNfcAuth(result.redirectTo);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      alert(`Hata oluştu: ${message}`);
      console.error(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("BUTON TIKLANDI - TEST (form submit)");
    void handlePinLogin();
  }

  function handleButtonClick() {
    console.log("BUTON TIKLANDI - TEST");
    void handlePinLogin();
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

      <p className="mb-3 text-center text-[10px] text-white/35">
        debug: canSubmit={String(canSubmit)} pinLen={pinDigits.length}
      </p>

      <form
        onSubmit={handleSubmit}
        className="relative z-20 flex flex-col gap-4 pointer-events-auto"
        noValidate
      >
        <label htmlFor="pin_code" className="text-[11px] uppercase tracking-widest text-white/45">
          PIN Kodu
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
          className={`${authInputClassName} text-center text-2xl font-semibold tracking-[0.45em] pointer-events-auto`}
        />

        {/* Geçici debug: sade HTML button — styled button tıklama sorununu izole eder */}
        <button
          type="button"
          disabled={loading}
          onClick={handleButtonClick}
          style={{
            pointerEvents: "auto",
            position: "relative",
            zIndex: 30,
            width: "100%",
            minHeight: "54px",
            padding: "12px 16px",
            border: "2px solid #fbbf24",
            borderRadius: "16px",
            background: loading ? "#78716c" : "#fbbf24",
            color: "#000",
            fontWeight: 700,
            fontSize: "14px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
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
