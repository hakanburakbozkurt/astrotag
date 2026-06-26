"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { savePostAuthReturnToAction } from "@/lib/actions/post-auth-return";
import { checkNfcSessionAction } from "@/lib/actions/nfc-auth";
import {
  loadProfileSetupPrefill,
  saveProfileSetup,
} from "@/lib/actions/profile-setup";
import { enterProfileEditModeAction } from "@/lib/actions/profile-edit-mode";
import { citiesData } from "@/data/cities.js";
import { HOME_PATH } from "@/lib/nfc/constants";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";

function FormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="profile-setup-field">
      <label htmlFor={id} className="profile-setup-label">
        {label}
      </label>
      {children}
    </div>
  );
}

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

  const districtOptions = useMemo(() => {
    if (!birthCity) {
      return [];
    }

    return citiesData.find((city) => city.name === birthCity)?.districts ?? [];
  }, [birthCity]);

  useEffect(() => {
    void (async () => {
      const session = await checkNfcSessionAction();
      if (!session.authenticated) {
        await savePostAuthReturnToAction("/profile-setup?mode=edit");
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

        if (prefill.name.trim() && prefill.birthDate.trim()) {
          void enterProfileEditModeAction();
        }
      }

      setSessionOk(true);
    })();
  }, []);

  useEffect(() => {
    if (!birthDistrict) {
      return;
    }

    if (!districtOptions.includes(birthDistrict)) {
      setBirthDistrict("");
    }
  }, [birthCity, birthDistrict, districtOptions]);

  async function handleSubmit(event: FormEvent) {
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
  }

  if (sessionOk !== true) {
    return (
      <p className="text-center text-sm text-white/45">Oturum kontrol ediliyor...</p>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="grid w-full min-w-0 max-w-full grid-cols-1 gap-5"
      noValidate
    >
      <FormField id="profile_name" label="Ad Soyad">
        <input
          id="profile_name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          autoComplete="name"
          placeholder="Adınız Soyadınız"
          className="profile-setup-input"
        />
      </FormField>

      <FormField id="profile_birth_date" label="Doğum Tarihi">
        <input
          id="profile_birth_date"
          name="birthDate"
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          required
          className="profile-setup-input"
        />
      </FormField>

      <FormField id="profile_birth_time" label="Doğum Saati">
        <input
          id="profile_birth_time"
          name="birthTime"
          type="time"
          value={birthTime}
          onChange={(event) => setBirthTime(event.target.value)}
          required
          className="profile-setup-input"
        />
      </FormField>

      <FormField id="profile_birth_city" label="İl">
        <select
          id="profile_birth_city"
          name="birthCity"
          value={birthCity}
          onChange={(event) => setBirthCity(event.target.value)}
          required
          className="profile-setup-input"
        >
          <option value="">İl seçin</option>
          {citiesData.map((city) => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="profile_birth_district" label="İlçe">
        <select
          id="profile_birth_district"
          name="birthDistrict"
          value={birthDistrict}
          onChange={(event) => setBirthDistrict(event.target.value)}
          required
          disabled={!birthCity}
          className="profile-setup-input disabled:opacity-50"
        >
          <option value="">
            {birthCity ? "İlçe seçin" : "Önce il seçin"}
          </option>
          {districtOptions.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="profile_phone" label="Telefon (opsiyonel)">
        <input
          id="profile_phone"
          name="phoneNumber"
          type="tel"
          inputMode="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          autoComplete="tel"
          placeholder="05XX XXX XX XX"
          className="profile-setup-input"
        />
      </FormField>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="profile-setup-submit"
      >
        {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
