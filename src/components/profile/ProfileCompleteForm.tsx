"use client";

import { FormEvent, useState } from "react";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import { completeUserProfile } from "@/lib/actions/profile-complete";

const fieldClass =
  "mt-2 h-12 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/30 [color-scheme:dark]";

type ProfileCompleteFormProps = {
  submitLabel?: string;
};

export default function ProfileCompleteForm({
  submitLabel = "Profili Tamamla",
}: ProfileCompleteFormProps) {
  const { safeReplace, isRouterReady } = useSafeRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await completeUserProfile({
      name,
      birthDate,
      birthTime,
      birthPlace,
      relationshipStatus,
    });

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    if (!isRouterReady) {
      setError("Yönlendirme hazırlanıyor, lütfen tekrar deneyin.");
      setIsSubmitting(false);
      return;
    }

    await safeReplace("/dashboard");
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex w-full min-w-0 flex-col gap-5"
    >
      <label htmlFor="name" className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
          İsim
        </span>
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

      <label htmlFor="birthPlace" className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
          Doğum Yeri
        </span>
        <input
          id="birthPlace"
          value={birthPlace}
          onChange={(event) => setBirthPlace(event.target.value)}
          required
          placeholder="Şehir, Ülke"
          className={fieldClass}
        />
      </label>

      <label htmlFor="relationshipStatus" className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
          İlişki Durumu
        </span>
        <select
          id="relationshipStatus"
          value={relationshipStatus}
          onChange={(event) => setRelationshipStatus(event.target.value)}
          required
          className={fieldClass}
        >
          <option value="" disabled>
            Seçiniz
          </option>
          <option value="İlişki Yok">İlişki Yok</option>
          <option value="İlişkisi Var">İlişkisi Var</option>
        </select>
      </label>

      {error ? <p className="text-sm text-red-300/80">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-12 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20 disabled:opacity-60"
      >
        {isSubmitting ? "Kaydediliyor..." : submitLabel}
      </button>
    </form>
  );
}
