"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import FormToast from "@/components/ui/FormToast";
import { compactLabelClass } from "@/components/navigation/compact-ui";
import {
  emptyPartnerForm,
  hasPartnerFormData,
  partnerFormFromUserData,
  partnerFormToInput,
  type PartnerFormValues,
} from "@/lib/partner-profile";
import { updatePartnerProfile } from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { useUserProfile } from "@/lib/auth";

const fieldClass =
  "box-border block h-10 w-full min-w-0 max-w-none appearance-none rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/30 [color-scheme:dark]";

export default function PartnerProfileSection() {
  const { userData, refreshProfile, isLoading: isProfileLoading } = useUserProfile();
  const [form, setForm] = useState<PartnerFormValues>(emptyPartnerForm);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!userData) {
      return;
    }

    setForm(partnerFormFromUserData(userData));
    setError(null);
  }, [userData]);

  const updateField = <K extends keyof PartnerFormValues>(
    key: K,
    value: PartnerFormValues[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setToast(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving || isProfileLoading || !userData) return;

    if (!form.partnerBirthDate.trim() || !form.partnerBirthTime.trim()) {
      setToast("Yükselen ve ev hesapları için doğum tarihi ve saati zorunludur.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);
    setToast(null);

    try {
      await updatePartnerProfile(partnerFormToInput(form));
      await refreshProfile();
      setMessage("Partner bilgileri kaydedildi.");
    } catch (err) {
      const errMessage =
        err instanceof SupabaseActionError
          ? err.message
          : "Partner bilgileri kaydedilemedi.";
      setError(errMessage);
      setToast(errMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isProfileLoading && !userData) {
    return (
      <section
        id="partner-profile"
        className="animate-pulse rounded-[20px] border border-white/10 bg-[#0f172a]/60 p-4"
        aria-busy="true"
      >
        <div className="h-3 w-32 rounded-full bg-white/10" />
        <div className="mt-4 space-y-3">
          <div className="h-10 rounded-lg bg-white/[0.06]" />
          <div className="h-10 rounded-lg bg-white/[0.06]" />
        </div>
      </section>
    );
  }

  return (
    <motion.section
      id="partner-profile"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[20px] border border-white/10 bg-[#0f172a]/80 p-4 backdrop-blur-2xl sm:p-5"
    >
      <p className={compactLabelClass}>Partner Profili · Natal Veri</p>
      <p className="mt-2 text-xs leading-relaxed text-white/50">
        Synastry ve yükselen (Ascendant) hesabı için doğum tarihi, saati ve yeri birlikte
        gereklidir. Yalnızca il/ilçe bilgisi harita için yeterli değildir.
      </p>

      {toast ? <FormToast message={toast} onDismiss={() => setToast(null)} /> : null}
      {error && !toast ? (
        <p className="mt-3 text-xs text-red-300/80">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 text-xs text-emerald-300/80">{message}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className={compactLabelClass}>Partner Adı</span>
          <input
            type="text"
            value={form.partnerName}
            onChange={(event) => updateField("partnerName", event.target.value)}
            className={fieldClass}
            placeholder="Partner adı"
            autoComplete="name"
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className={compactLabelClass}>Doğum Tarihi *</span>
            <input
              type="date"
              value={form.partnerBirthDate}
              onChange={(event) =>
                updateField("partnerBirthDate", event.target.value)
              }
              className={fieldClass}
              required
            />
          </label>

          <label className="block min-w-0">
            <span className={compactLabelClass}>Doğum Saati *</span>
            <input
              type="time"
              value={form.partnerBirthTime}
              onChange={(event) =>
                updateField("partnerBirthTime", event.target.value)
              }
              className={fieldClass}
              required
            />
          </label>
        </div>

        <p className="text-[10px] leading-relaxed text-amber-200/55">
          Doğum saati bilinmiyorsa en yakın tahmini girin; yükselen derecesi buna göre
          değişir.
        </p>

        <label className="block">
          <span className={compactLabelClass}>Doğum Yeri</span>
          <input
            type="text"
            value={form.partnerBirthPlace}
            onChange={(event) =>
              updateField("partnerBirthPlace", event.target.value)
            }
            className={fieldClass}
            placeholder="Şehir, ilçe"
            autoComplete="address-level2"
            required
          />
        </label>

        <button
          type="submit"
          disabled={isSaving || isProfileLoading}
          className="min-h-9 w-full rounded-lg border border-amber-400/35 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Kaydediliyor..." : "Partner Bilgilerini Kaydet"}
        </button>

        {userData && hasPartnerFormData(partnerFormFromUserData(userData)) ? (
          <p className="text-center text-[10px] text-white/35">
            Kayıtlı partner: {userData.partnerName}
          </p>
        ) : null}
      </form>
    </motion.section>
  );
}
