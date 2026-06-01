"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import {
  emptyPartnerForm,
  hasPartnerFormData,
  partnerFormFromUserData,
  partnerFormToInput,
  type PartnerFormValues,
} from "@/lib/partner-profile";
import {
  getPartnerProfile,
  updatePartnerProfile,
} from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";

const fieldClass =
  "mt-2 h-12 w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/30 [color-scheme:dark]";

export default function PartnerSettingsPage() {
  useRequireAuth();
  const { userData, isLoading: profileLoading, refreshProfile } = useUserProfile();
  const [form, setForm] = useState<PartnerFormValues>(emptyPartnerForm);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPartnerProfile = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      const partner = await getPartnerProfile();
      setForm(partner);
    } catch (err) {
      setForm(emptyPartnerForm());
      setError(
        err instanceof SupabaseActionError
          ? err.message
          : "Partner bilgileri yüklenemedi."
      );
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (profileLoading || !userData) {
      return;
    }

    void loadPartnerProfile();
  }, [profileLoading, userData, loadPartnerProfile]);

  const updateField = <K extends keyof PartnerFormValues>(
    key: K,
    value: PartnerFormValues[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving || isFetching) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await updatePartnerProfile(partnerFormToInput(form));
      setForm(partnerFormFromUserData(updated));
      await refreshProfile();
      setMessage("Partner bilgileri kaydedildi. Synastry analizi aktif.");
    } catch (err) {
      setError(
        err instanceof SupabaseActionError
          ? err.message
          : "Partner bilgileri kaydedilemedi."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading || !userData) {
    return (
      <main className="relative min-h-dvh">
        <Starfield />
        <div className="relative flex min-h-dvh items-center justify-center px-4">
          <p className="text-sm text-white/45">Ayarlar yükleniyor...</p>
        </div>
      </main>
    );
  }

  const hasExistingPartner = hasPartnerFormData(form);

  return (
    <main className="relative min-h-dvh">
      <Starfield />

      <div className="relative mx-auto w-full max-w-xl overflow-x-hidden px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/dashboard"
          className="text-xs uppercase tracking-[0.25em] text-amber-400/70"
        >
          ← Dashboard
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 w-full min-w-0 rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
            Partner Ayarları
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Synastry Profili</h1>
          <p className="mt-2 text-sm text-white/45">
            {hasExistingPartner
              ? "Kayıtlı partner bilgileriniz aşağıda. Düzenleyip kaydedebilirsiniz."
              : "Partner doğum bilgileri horary analizinde uyumluluk bölümünü otomatik aktive eder."}
          </p>

          {isFetching ? (
            <p className="mt-6 text-sm text-white/45">Partner bilgileri yükleniyor...</p>
          ) : (
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="mt-6 flex w-full min-w-0 flex-col gap-5"
            >
              <label className="block w-full min-w-0">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                  Partner Adı
                </span>
                <input
                  name="partnerName"
                  value={form.partnerName}
                  onChange={(event) => updateField("partnerName", event.target.value)}
                  required
                  placeholder="Partner adı"
                  className={fieldClass}
                />
              </label>

              <label className="block w-full min-w-0">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                  Doğum Tarihi
                </span>
                <input
                  name="partnerBirthDate"
                  type="date"
                  value={form.partnerBirthDate}
                  onChange={(event) =>
                    updateField("partnerBirthDate", event.target.value)
                  }
                  required
                  className={fieldClass}
                />
              </label>

              <label className="block w-full min-w-0">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                  Doğum Saati
                </span>
                <input
                  name="partnerBirthTime"
                  type="time"
                  value={form.partnerBirthTime}
                  onChange={(event) =>
                    updateField("partnerBirthTime", event.target.value)
                  }
                  required
                  className={fieldClass}
                />
              </label>

              <label className="block w-full min-w-0">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                  Doğum Yeri
                </span>
                <input
                  name="partnerBirthPlace"
                  value={form.partnerBirthPlace}
                  onChange={(event) =>
                    updateField("partnerBirthPlace", event.target.value)
                  }
                  required
                  placeholder="Şehir, Ülke"
                  className={fieldClass}
                />
              </label>

              {error ? <p className="text-sm text-red-300/80">{error}</p> : null}
              {message ? <p className="text-sm text-amber-200/80">{message}</p> : null}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-xl border border-amber-400/30 bg-amber-400/10 py-3 text-sm font-medium text-amber-100 disabled:opacity-60"
              >
                {isSaving ? "Kaydediliyor..." : "Partner Bilgilerini Kaydet"}
              </button>
            </form>
          )}
        </motion.section>
      </div>
    </main>
  );
}
