"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import FormToast from "@/components/ui/FormToast";
import { compactLabelClass } from "@/components/navigation/compact-ui";
import {
  BOND_RELATIONSHIP_OPTIONS,
  bondAdditionalFromUserData,
  bondAdditionalToInput,
  emptyBondAdditionalForm,
  emptyPartnerForm,
  hasPartnerFormData,
  partnerFormFromUserData,
  partnerFormToInput,
  type BondAdditionalFormValues,
  type PartnerFormValues,
} from "@/lib/partner-profile";
import { updateBondAdditionalInfo, updatePartnerProfile } from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { useUserProfile } from "@/lib/auth";

const fieldClass =
  "box-border block h-10 w-full min-w-0 max-w-none appearance-none rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/30 [color-scheme:dark]";

export default function BondPartnerSettingsSection() {
  const { userData, refreshProfile, isLoading: isProfileLoading } = useUserProfile();
  const [partnerForm, setPartnerForm] = useState<PartnerFormValues>(emptyPartnerForm);
  const [bondForm, setBondForm] = useState<BondAdditionalFormValues>(emptyBondAdditionalForm);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!userData) {
      return;
    }

    setPartnerForm(partnerFormFromUserData(userData));
    setBondForm(bondAdditionalFromUserData(userData));
    setError(null);
  }, [userData]);

  const updatePartnerField = <K extends keyof PartnerFormValues>(
    key: K,
    value: PartnerFormValues[K]
  ) => {
    setPartnerForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setToast(null);
  };

  const updateBondField = <K extends keyof BondAdditionalFormValues>(
    key: K,
    value: BondAdditionalFormValues[K]
  ) => {
    setBondForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setToast(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving || isProfileLoading || !userData) return;

    if (!partnerForm.partnerBirthDate.trim() || !partnerForm.partnerBirthTime.trim()) {
      setToast("Yükselen ve ev hesapları için doğum tarihi ve saati zorunludur.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);
    setToast(null);

    try {
      await updatePartnerProfile(partnerFormToInput(partnerForm));
      await updateBondAdditionalInfo(bondAdditionalToInput(bondForm));
      await refreshProfile();
      setMessage("Partner ve Astro-Bağ bilgileri kaydedildi.");
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
        id="bond-partner"
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
      id="bond-partner"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6"
    >
      <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
        Partner & Astro-Bağ
      </p>
      <p className="mt-2 text-xs leading-relaxed text-white/50">
        Partner natal verisi ve ilişki bağlamı tek kartta — synastry, Nexus ve Bonds
        analizlerinde kullanılır.
      </p>

      {toast ? <FormToast message={toast} onDismiss={() => setToast(null)} /> : null}
      {error && !toast ? (
        <p className="mt-3 text-xs text-red-300/80">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 text-xs text-emerald-300/80">{message}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="space-y-3 border-b border-white/[0.06] pb-5">
          <p className={compactLabelClass}>Partner Profili · Natal Veri</p>

          <label className="block">
            <span className={compactLabelClass}>Partner Adı</span>
            <input
              type="text"
              value={partnerForm.partnerName}
              onChange={(event) => updatePartnerField("partnerName", event.target.value)}
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
                value={partnerForm.partnerBirthDate}
                onChange={(event) =>
                  updatePartnerField("partnerBirthDate", event.target.value)
                }
                className={fieldClass}
                required
              />
            </label>

            <label className="block min-w-0">
              <span className={compactLabelClass}>Doğum Saati *</span>
              <input
                type="time"
                value={partnerForm.partnerBirthTime}
                onChange={(event) =>
                  updatePartnerField("partnerBirthTime", event.target.value)
                }
                className={fieldClass}
                required
              />
            </label>
          </div>

          <label className="block">
            <span className={compactLabelClass}>Doğum Yeri</span>
            <input
              type="text"
              value={partnerForm.partnerBirthPlace}
              onChange={(event) =>
                updatePartnerField("partnerBirthPlace", event.target.value)
              }
              className={fieldClass}
              placeholder="Şehir, ilçe"
              autoComplete="address-level2"
              required
            />
          </label>
        </div>

        <div className="space-y-3">
          <p className={compactLabelClass}>Astro-Bağ · Ek Bilgiler</p>

          <label className="block">
            <span className={compactLabelClass}>İlişki Durumu</span>
            <select
              value={bondForm.relationshipStatus}
              onChange={(event) =>
                updateBondField("relationshipStatus", event.target.value)
              }
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
              value={bondForm.partnerMeetingDate}
              onChange={(event) =>
                updateBondField("partnerMeetingDate", event.target.value)
              }
              className={fieldClass}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving || isProfileLoading}
          className="min-h-11 w-full rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Kaydediliyor..." : "Partner & Astro-Bağ Kaydet"}
        </button>

        {userData && hasPartnerFormData(partnerFormFromUserData(userData)) ? (
          <p className="text-center text-[10px] text-white/35">
            Kayıtlı partner: {userData.partnerName}
          </p>
        ) : null}
      </form>

      <Link
        href="/dashboard/bonds"
        className="mt-4 inline-flex text-xs uppercase tracking-[0.18em] text-amber-300/75 hover:text-amber-200"
      >
        Bonds sekmesinde uyumluluk analizi →
      </Link>
    </motion.section>
  );
}
