"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { LOGIN_PATH } from "@/lib/supabase-actions";
import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import { generateReferralCode } from "@/lib/referral";
import type { UserData } from "@/types/user";

type RegistrationFieldKey =
  | "name"
  | "birthDate"
  | "birthTime"
  | "birthPlace"
  | "relationshipStatus";

type TextField = {
  id: RegistrationFieldKey;
  label: string;
  type: "text" | "date" | "time";
  placeholder?: string;
};

type SelectField = {
  id: RegistrationFieldKey;
  label: string;
  type: "select";
  options: string[];
};

type FieldConfig = TextField | SelectField;

const fields: FieldConfig[] = [
  { id: "name", label: "İsim", type: "text", placeholder: "Adınız" },
  { id: "birthDate", label: "Doğum Tarihi", type: "date" },
  { id: "birthTime", label: "Doğum Saati", type: "time", placeholder: "--:--" },
  {
    id: "birthPlace",
    label: "Doğum Yeri",
    type: "text",
    placeholder: "Şehir, Ülke",
  },
  {
    id: "relationshipStatus",
    label: "İlişki Durumu",
    type: "select",
    options: ["İlişki Yok", "İlişkisi Var"],
  },
];

const fieldClass =
  "mt-2 h-12 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/30 [color-scheme:dark]";

const PROFILE_TABLE = "profiles";

type ProfileInsert = {
  id: string;
  nfc_uid: string | null;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  relationship_status: string;
  cosmic_energy: number;
  energy_bonus: number;
  referral_code: string;
};

type ProfileCompleteFormProps = {
  onComplete?: (data: UserData) => void;
  submitLabel?: string;
};

export default function ProfileCompleteForm({
  onComplete,
  submitLabel = "Profili Tamamla",
}: ProfileCompleteFormProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const values: Record<RegistrationFieldKey, string> = {
    name,
    birthDate,
    birthTime,
    birthPlace,
    relationshipStatus,
  };

  const setters: Record<RegistrationFieldKey, (value: string) => void> = {
    name: setName,
    birthDate: setBirthDate,
    birthTime: setBirthTime,
    birthPlace: setBirthPlace,
    relationshipStatus: setRelationshipStatus,
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(LOGIN_PATH);
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (
      !name.trim() ||
      !birthDate ||
      !birthTime ||
      !birthPlace.trim() ||
      !relationshipStatus ||
      isSubmitting
    ) {
      return;
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser?.id) {
      router.replace(LOGIN_PATH);
      return;
    }

    const userData: UserData = {
      name: name.trim(),
      birthDate,
      birthTime,
      birthPlace: birthPlace.trim(),
      relationshipStatus,
      cosmicEnergy: STARTING_ENERGY,
      energyBonus: 0,
    };

    const nfcUid =
      typeof window !== "undefined" ? sessionStorage.getItem("nfcId") : null;

    const profileInsert: ProfileInsert = {
      id: authUser.id,
      nfc_uid: nfcUid,
      name: userData.name,
      birth_date: userData.birthDate,
      birth_time: userData.birthTime,
      birth_place: userData.birthPlace,
      relationship_status: userData.relationshipStatus,
      cosmic_energy: STARTING_ENERGY,
      energy_bonus: 0,
      referral_code: generateReferralCode(),
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from(PROFILE_TABLE)
        .upsert(profileInsert);

      if (upsertError) {
        throw upsertError;
      }

      onComplete?.(userData);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Profil kaydedilemedi. Lütfen tekrar deneyin."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex w-full min-w-0 flex-col gap-5"
    >
      {fields.map((field) => (
        <label key={field.id} htmlFor={field.id} className="block w-full min-w-0">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            {field.label}
          </span>
          {field.type === "select" ? (
            <select
              id={field.id}
              value={values[field.id]}
              onChange={(event) => setters[field.id](event.target.value)}
              required
              className={fieldClass}
            >
              <option value="" disabled>
                Seçiniz
              </option>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={field.id}
              type={field.type}
              value={values[field.id]}
              onChange={(event) => setters[field.id](event.target.value)}
              required
              placeholder={field.placeholder}
              className={fieldClass}
            />
          )}
        </label>
      ))}

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
