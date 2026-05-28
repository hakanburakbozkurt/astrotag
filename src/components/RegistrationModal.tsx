"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { LOGIN_PATH } from "@/lib/supabase-actions";
import { STARTING_ENERGY } from "@/lib/constants/cosmic";
import { generateReferralCode } from "@/lib/referral";

import type { UserData } from "@/types/user";

export type { UserData };

interface RegistrationModalProps {
  onComplete: (data: UserData) => void;
}

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
  { id: "birthPlace", label: "Doğum Yeri", type: "text", placeholder: "Şehir/Ülke" },
  { id: "relationshipStatus", label: "İlişki Durumu", type: "select", options: ["İlişki Yok", "İlişkisi Var"] },
];

const fieldClass = "mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white outline-none transition-all placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]";
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

type PostgresErrorShape = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function inferErrorCause(error: PostgresErrorShape): string {
  const combined = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (combined.includes("row-level security") || error.code === "42501") {
    return "RLS (Row Level Security) — insert policy eksik veya yetkisiz";
  }
  if (combined.includes("column") || combined.includes("does not exist")) {
    return "Kolon uyuşmazlığı — tablo şeması ile profileInsert eşleşmiyor";
  }
  if (combined.includes("invalid input") || combined.includes("type")) {
    return "Veri tipi uyuşmazlığı — örn. date/time formatı veya null kısıtı";
  }
  if (combined.includes("duplicate") || error.code === "23505") {
    return "Duplicate key — nfc_uid zaten kayıtlı";
  }
  if (combined.includes("violates not-null") || error.code === "23502") {
    return "NOT NULL ihlali — zorunlu kolon boş gönderilmiş";
  }

  return "Bilinmeyen — message/code/details/hint alanlarına bak";
}

function toPostgresError(error: unknown): PostgresErrorShape {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const pgError = error as PostgresErrorShape;
  return {
    message: pgError.message,
    code: pgError.code,
    details: pgError.details,
    hint: pgError.hint,
  };
}

async function logSupabaseError(error: unknown, payload?: ProfileInsert) {
  const postgresError = toPostgresError(error);
  const likelyCause = inferErrorCause(postgresError);

  const logPayload = {
    table: PROFILE_TABLE,
    likelyCause,
    profileInsert: payload ?? null,
    error: postgresError,
    raw: JSON.stringify(error, null, 2),
  };

  console.error("Detaylı Hata:", logPayload.raw);
  console.error("Detaylı Hata (okunabilir):", postgresError);
  console.error("Olası sebep:", likelyCause);

  if (payload) {
    console.error("Gönderilen profileInsert:", payload);
    console.error("Tablo:", PROFILE_TABLE);
    console.error("Kolonlar:", Object.keys(payload));
    console.error("error.details:", postgresError.details ?? "(yok)");
  }

  console.log("[RegistrationModal] Sunucu terminaline log gönderiliyor...", logPayload);

  try {
    await fetch("/api/debug-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logPayload),
    });
  } catch (fetchError) {
    console.warn("Sunucu terminaline log yazılamadı:", fetchError);
  }
}

export default function RegistrationModal({ onComplete }: RegistrationModalProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthDate || !birthTime || !birthPlace.trim() || !relationshipStatus) return;

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
    try {
      const { error } = await supabase.from(PROFILE_TABLE).upsert(profileInsert);

      if (error) {
        await logSupabaseError(error, profileInsert);
        alert("İşlem Başarısız");
        return;
      }

      onComplete(userData);
      router.push("/dashboard");
    } catch (error) {
      await logSupabaseError(error, profileInsert);
      alert("İşlem Başarısız");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-5">
      <form onSubmit={handleSubmit} className="relative mx-auto w-full max-w-sm rounded-[32px] shadow-[0_0_40px_rgba(0,0,0,0.6),inset_0_0_1px_rgba(255,255,255,0.1)]">
        <div className="absolute inset-0 rounded-[32px] border border-white/10 bg-[#0f172a]/40 backdrop-blur-2xl" />
        <div className="relative grid grid-cols-1 place-items-center p-10">
          <div className="w-full space-y-6">
            <div className="text-center">
              <h2 className="mb-6 text-4xl font-extrabold tracking-tighter text-white/90">HOŞ GELDİN</h2>
              <p className="mb-8 text-[11px] font-light uppercase tracking-[0.4em] text-white/40">Yıldız Haritanı Keşfet</p>
            </div>
            {fields.map((field) => (
              <div key={field.id} className="w-full">
                <label htmlFor={field.id} className="block text-[10px] uppercase tracking-widest text-white/60">{field.label}</label>
                {field.type === "select" ? (
                  <select id={field.id} value={values[field.id]} onChange={(e) => setters[field.id](e.target.value)} required className={fieldClass}>
                    <option value="" disabled>Seçiniz</option>
                    {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <input id={field.id} type={field.type} value={values[field.id]} onChange={(e) => setters[field.id](e.target.value)} required placeholder={field.placeholder} className={fieldClass} />
                )}
              </div>
            ))}
            <button type="submit" disabled={isSubmitting} className="h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600/40 to-indigo-600/40 text-white disabled:opacity-60">
              {isSubmitting ? "Kaydediliyor..." : "Kaydol"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}