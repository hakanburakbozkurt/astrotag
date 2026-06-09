"use client";

import { FormEvent, useEffect, useState } from "react";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { checkNfcSessionAction } from "@/lib/actions/nfc-auth";
import { saveProfileSetup } from "@/lib/actions/profile-setup";
import { HOME_PATH } from "@/lib/nfc/constants";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";

const fieldClass =
  "mt-2 h-12 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/30 [color-scheme:dark]";

type ProfileSetupFormProps = {
  submitLabel?: string;
  pinLabel?: string;
};

export default function ProfileSetupForm({
  submitLabel = "Kaydet ve Devam Et",
  pinLabel = "PIN Kodunuz",
}: ProfileSetupFormProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [birthDistrict, setBirthDistrict] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
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
      setSessionOk(true);
    })();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (isSubmitting || pin !== pinConfirm) {
      if (pin !== pinConfirm) {
        setError("PIN kodları eşleşmiyor.");
      }
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
      pin,
    });

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    navigateAfterNfcAuth("/dashboard");
  };

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
      <label htmlFor="name" className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">Ad</span>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          placeholder="Adınız"
          className={fieldClass}
        />
      </label>

      <label htmlFor="birthDate" className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
          Doğum Tarihi
        </span>
        <input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          required
          className={fieldClass}
        />
      </label>

      <label htmlFor="birthTime" className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
          Doğum Saati
        </span>
        <input
          id="birthTime"
          type="time"
          value={birthTime}
          onChange={(event) => setBirthTime(event.target.value)}
          required
          className={fieldClass}
        />
      </label>

      <label htmlFor="birthCity" className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">İl</span>
        <input
          id="birthCity"
          value={birthCity}
          onChange={(event) => setBirthCity(event.target.value)}
          required
          placeholder="İstanbul"
          className={fieldClass}
        />
      </label>

      <label htmlFor="birthDistrict" className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">İlçe</span>
        <input
          id="birthDistrict"
          value={birthDistrict}
          onChange={(event) => setBirthDistrict(event.target.value)}
          required
          placeholder="Kadıköy"
          className={fieldClass}
        />
      </label>

      <div className="mt-2 border-t border-white/10 pt-5">
        <p className="mb-4 text-center text-[11px] uppercase tracking-[0.2em] text-amber-400/70">
          PIN Yönetimi
        </p>

        <label htmlFor="pin" className="block w-full min-w-0">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            {pinLabel}
          </span>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            minLength={4}
            maxLength={8}
            value={pin}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, "").slice(0, 8))
            }
            required
            placeholder="••••"
            className={`${fieldClass} text-center text-xl tracking-[0.45em]`}
          />
        </label>

        <label htmlFor="pinConfirm" className="mt-4 block w-full min-w-0">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            PIN Tekrar
          </span>
          <input
            id="pinConfirm"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            minLength={4}
            maxLength={8}
            value={pinConfirm}
            onChange={(event) =>
              setPinConfirm(event.target.value.replace(/\D/g, "").slice(0, 8))
            }
            required
            placeholder="••••"
            className={`${fieldClass} text-center text-xl tracking-[0.45em]`}
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-300/80">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting || pin.length < 4}
        className="min-h-12 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20 disabled:opacity-60"
      >
        {isSubmitting ? "Kaydediliyor..." : submitLabel}
      </button>
    </form>
  );
}
