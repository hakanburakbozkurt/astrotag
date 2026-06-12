"use client";

import { FormEvent, useEffect, useState } from "react";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { checkNfcSessionAction } from "@/lib/actions/nfc-auth";
import {
  loadProfileSetupPrefill,
  saveProfileSetup,
} from "@/lib/actions/profile-setup";
import { HOME_PATH } from "@/lib/nfc/constants";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";

const labelClass = "block w-full min-w-0 max-w-full";
const labelTextClass =
  "text-[10px] uppercase tracking-[0.2em] text-white/60";

export default function ProfileSetupForm() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [birthDistrict, setBirthDistrict] = useState("");
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

      const prefill = await loadProfileSetupPrefill();
      if (prefill) {
        setName(prefill.name);
        setBirthDate(prefill.birthDate);
        setBirthTime(prefill.birthTime);
        setBirthCity(prefill.birthCity);
        setBirthDistrict(prefill.birthDistrict);
        setPhoneNumber(prefill.phoneNumber);
      }

      setSessionOk(true);
    })();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await saveProfileSetup({
      name,
      birthDate,
      birthTime,
      birthCity,
      birthDistrict,
      phoneNumber: phoneNumber.trim() || undefined,
    });

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    navigateAfterNfcAuth(result.redirectTo);
  };

  if (sessionOk !== true) {
    return (
      <p className="text-center text-sm text-white/45">Oturum kontrol ediliyor...</p>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="grid w-full min-w-0 max-w-full grid-cols-1 gap-5"
    >
      <label htmlFor="name" className={labelClass}>
        <span className={labelTextClass}>Ad Soyad</span>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          autoComplete="name"
          placeholder="Adınız Soyadınız"
          className="registration-field-input"
        />
      </label>

      <label htmlFor="birthDate" className={labelClass}>
        <span className={labelTextClass}>Doğum Tarihi</span>
        <input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          required
          className="registration-field-input"
        />
      </label>

      <label htmlFor="birthTime" className={labelClass}>
        <span className={labelTextClass}>Doğum Saati</span>
        <input
          id="birthTime"
          type="time"
          value={birthTime}
          onChange={(event) => setBirthTime(event.target.value)}
          required
          className="registration-field-input"
        />
      </label>

      <label htmlFor="birthCity" className={labelClass}>
        <span className={labelTextClass}>İl</span>
        <input
          id="birthCity"
          value={birthCity}
          onChange={(event) => setBirthCity(event.target.value)}
          required
          placeholder="İstanbul"
          className="registration-field-input"
        />
      </label>

      <label htmlFor="birthDistrict" className={labelClass}>
        <span className={labelTextClass}>İlçe</span>
        <input
          id="birthDistrict"
          value={birthDistrict}
          onChange={(event) => setBirthDistrict(event.target.value)}
          required
          placeholder="Kadıköy"
          className="registration-field-input"
        />
      </label>

      <label htmlFor="phoneNumber" className={labelClass}>
        <span className={labelTextClass}>Telefon (opsiyonel)</span>
        <input
          id="phoneNumber"
          type="tel"
          inputMode="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          autoComplete="tel"
          placeholder="05XX XXX XX XX"
          className="registration-field-input"
        />
      </label>

      {error ? <p className="text-sm text-red-300/80">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-12 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20 disabled:opacity-60"
      >
        {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
