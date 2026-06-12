"use client";

import { FormEvent, useEffect, useState } from "react";
import { checkNfcSessionAction } from "@/lib/actions/nfc-auth";
import {
  loadRegistrationCompletePrefill,
  saveRegistrationComplete,
} from "@/lib/actions/registration-complete";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { HOME_PATH } from "@/lib/nfc/constants";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";

const fieldClass =
  "mt-2 h-12 w-full min-w-0 rounded-2xl border border-white/10 bg-[#070b14]/60 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 [color-scheme:dark]";

export default function RegistrationCompleteForm() {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const session = await checkNfcSessionAction();
      if (!session.authenticated) {
        clientRedirect(HOME_PATH);
        return;
      }

      const prefill = await loadRegistrationCompletePrefill();
      if (prefill) {
        setFullName(prefill.fullName);
        setBirthDate(prefill.birthDate);
        setPhoneNumber(prefill.phoneNumber);
      }

      setSessionOk(true);
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
    });

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    navigateAfterNfcAuth(result.redirectTo);
  }

  if (sessionOk !== true) {
    return (
      <p className="text-center text-sm text-white/45">Oturum kontrol ediliyor...</p>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex w-full min-w-0 flex-col gap-5"
    >
      <label htmlFor="full_name" className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.22em] text-white/55">
          Ad Soyad
        </span>
        <input
          id="full_name"
          name="full_name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          autoComplete="name"
          placeholder="Adınız Soyadınız"
          className={fieldClass}
        />
      </label>

      <label htmlFor="birth_date" className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.22em] text-white/55">
          Doğum Tarihi
        </span>
        <input
          id="birth_date"
          name="birth_date"
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          required
          className={fieldClass}
        />
      </label>

      <label htmlFor="phone_number" className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.22em] text-white/55">
          Telefon
        </span>
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
          className={fieldClass}
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
