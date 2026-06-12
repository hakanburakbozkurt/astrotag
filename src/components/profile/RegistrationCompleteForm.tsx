"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  loadRegistrationCompletePrefill,
  saveRegistrationComplete,
} from "@/lib/actions/registration-complete";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";

const labelClass = "block w-full min-w-0 max-w-full";
const labelTextClass =
  "text-[10px] uppercase tracking-[0.22em] text-white/55";

export default function RegistrationCompleteForm() {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPrefill, setIsLoadingPrefill] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const prefill = await loadRegistrationCompletePrefill();

      if (prefill) {
        setFullName(prefill.fullName);
        setBirthDate(prefill.birthDate);
        setPhoneNumber(prefill.phoneNumber);
      }

      setIsLoadingPrefill(false);
    })();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await saveRegistrationComplete({
      fullName,
      birthDate,
      phoneNumber,
      pinCode,
    });

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    navigateAfterNfcAuth(result.redirectTo);
  }

  if (isLoadingPrefill) {
    return (
      <p className="text-center text-sm text-white/45">Form yükleniyor...</p>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="grid w-full min-w-0 max-w-full grid-cols-1 gap-5"
    >
      <label htmlFor="full_name" className={labelClass}>
        <span className={labelTextClass}>Ad Soyad</span>
        <input
          id="full_name"
          name="full_name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          autoComplete="name"
          placeholder="Adınız Soyadınız"
          className="registration-field-input"
        />
      </label>

      <label htmlFor="birth_date" className={labelClass}>
        <span className={labelTextClass}>Doğum Tarihi</span>
        <input
          id="birth_date"
          name="birth_date"
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          required
          className="registration-field-input"
        />
      </label>

      <label htmlFor="phone_number" className={labelClass}>
        <span className={labelTextClass}>Telefon</span>
        <input
          id="phone_number"
          name="phone_number"
          type="tel"
          inputMode="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          required
          autoComplete="tel"
          placeholder="05XX XXX XX XX"
          className="registration-field-input"
        />
      </label>

      <label htmlFor="pin_code" className={labelClass}>
        <span className={labelTextClass}>PIN Kodu</span>
        <input
          id="pin_code"
          name="pin_code"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pinCode}
          onChange={(event) =>
            setPinCode(event.target.value.replace(/\D/g, "").slice(0, 8))
          }
          required
          minLength={4}
          maxLength={8}
          placeholder="••••"
          className="registration-field-input tracking-[0.35em]"
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-[52px] w-full rounded-2xl border border-amber-400/35 bg-gradient-to-b from-amber-400/20 to-amber-500/10 py-3 text-sm font-semibold text-amber-50 transition hover:from-amber-400/30 hover:to-amber-500/15 disabled:opacity-60"
      >
        {isSubmitting ? "Kaydediliyor..." : "Kaydı Tamamla"}
      </button>
    </form>
  );
}
