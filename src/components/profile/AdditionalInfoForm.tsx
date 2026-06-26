"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import FormToast from "@/components/ui/FormToast";
import { compactLabelClass } from "@/components/navigation/compact-ui";
import {
  BOND_RELATIONSHIP_OPTIONS,
  bondAdditionalFromUserData,
  bondAdditionalToInput,
  emptyBondAdditionalForm,
  type BondAdditionalFormValues,
} from "@/lib/partner-profile";
import { updateBondAdditionalInfo } from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { useUserProfile } from "@/lib/auth";

const fieldClass =
  "box-border block h-10 w-full min-w-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-amber-400/30 [color-scheme:dark]";

export default function AdditionalInfoForm() {
  const { userData, refreshProfile, isLoading: isProfileLoading } = useUserProfile();
  const [form, setForm] = useState<BondAdditionalFormValues>(emptyBondAdditionalForm);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!userData) {
      return;
    }

    setForm(bondAdditionalFromUserData(userData));
    setError(null);
  }, [userData]);

  const updateField = <K extends keyof BondAdditionalFormValues>(
    key: K,
    value: BondAdditionalFormValues[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setToast(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving || isProfileLoading || !userData) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);
    setToast(null);

    try {
      await updateBondAdditionalInfo(bondAdditionalToInput(form));
      await refreshProfile();
      setMessage("Astro-Bağ bilgileri kaydedildi.");
    } catch (err) {
      const errMessage =
        err instanceof SupabaseActionError
          ? err.message
          : "Astro-Bağ bilgileri kaydedilemedi.";
      setError(errMessage);
      setToast(errMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isProfileLoading && !userData) {
    return null;
  }

  return (
    <motion.section
      id="astro-bond-info"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="rounded-[20px] border border-white/10 bg-[#0f172a]/80 p-4 backdrop-blur-2xl sm:p-5"
    >
      <p className={compactLabelClass}>Astro-Bağ · Ek Bilgiler</p>
      <p className="mt-2 text-xs leading-relaxed text-white/50">
        İlişki bağlamı synastry yorumlarında ve günlük uyum analizinde kullanılır.
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
          <span className={compactLabelClass}>İlişki Durumu</span>
          <select
            value={form.relationshipStatus}
            onChange={(event) => updateField("relationshipStatus", event.target.value)}
            className={fieldClass}
            required
          >
            {BOND_RELATIONSHIP_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={compactLabelClass}>Tanışma Tarihi</span>
          <input
            type="date"
            value={form.partnerMeetingDate}
            onChange={(event) =>
              updateField("partnerMeetingDate", event.target.value)
            }
            className={fieldClass}
          />
          <span className="mt-1 block text-[10px] text-white/35">
            Opsiyonel — ilişki zaman çizelgesi için
          </span>
        </label>

        <button
          type="submit"
          disabled={isSaving || isProfileLoading}
          className="min-h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-amber-100 transition hover:border-amber-400/30 hover:bg-white/[0.06] disabled:opacity-50"
        >
          {isSaving ? "Kaydediliyor..." : "Astro-Bağ Bilgilerini Kaydet"}
        </button>
      </form>
    </motion.section>
  );
}
