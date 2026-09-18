"use client";

import { FormEvent, useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil } from "lucide-react";
import FormToast from "@/components/ui/FormToast";
import {
  compactLabelClass,
  compactSectionClass,
} from "@/components/navigation/compact-ui";
import {
  noirFieldClass,
  noirInlineButtonClass,
  noirPrimaryButtonClass,
  noirSecondaryButtonClass,
} from "@/lib/theme/noir-tokens";
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

const fieldClass = `${noirFieldClass} mt-0 max-w-none appearance-none [color-scheme:dark]`;

function formatDisplayDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${trimmed}T12:00:00`));
  } catch {
    return trimmed;
  }
}

function formatDisplayTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "—";
  }
  return trimmed.slice(0, 5);
}

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-xs text-stone-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium leading-snug text-stone-300 sm:text-right">
        {value}
      </dd>
    </div>
  );
}

function ViewFieldGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-xs text-stone-500">{title}</p>
      <dl className="divide-y divide-zinc-800 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-950">
        {children}
      </dl>
    </div>
  );
}

export default function ProfileInfoSection() {
  const { userData, refreshProfile, isLoading: isProfileLoading } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [partnerForm, setPartnerForm] = useState<PartnerFormValues>(emptyPartnerForm);
  const [bondForm, setBondForm] = useState<BondAdditionalFormValues>(emptyBondAdditionalForm);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const syncFormsFromProfile = useCallback(() => {
    if (!userData) {
      return;
    }
    setPartnerForm(partnerFormFromUserData(userData));
    setBondForm(bondAdditionalFromUserData(userData));
    setError(null);
  }, [userData]);

  useEffect(() => {
    syncFormsFromProfile();
  }, [syncFormsFromProfile]);

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

  const handleStartEditing = () => {
    syncFormsFromProfile();
    setMessage(null);
    setToast(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    syncFormsFromProfile();
    setMessage(null);
    setToast(null);
    setIsEditing(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving || isProfileLoading || !userData || !isEditing) {
      return;
    }

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
      setIsEditing(false);
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

  const hasPartnerData = userData
    ? hasPartnerFormData(partnerFormFromUserData(userData))
    : false;

  if (isProfileLoading && !userData) {
    return (
      <section
        id="bond-partner"
        className={`animate-pulse ${compactSectionClass}`}
        aria-busy="true"
      >
        <div className="h-3 w-40 rounded-full bg-white/10" />
        <div className="mt-5 space-y-3">
          <div className="h-12 rounded-xl bg-white/[0.06]" />
          <div className="h-12 rounded-xl bg-white/[0.06]" />
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
      className={`${compactSectionClass} w-full min-w-0 sm:p-6`}
    >
      <div className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 whitespace-normal break-words">
          <p className="text-sm font-medium text-stone-300">Partner & Astro-Bağ</p>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            Partner natal verisi ve ilişki bağlamı — synastry, Nexus ve Bonds analizlerinde
            kullanılır.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleStartEditing}
            className={`${noirInlineButtonClass} self-start sm:mt-0.5`}
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Düzenle
          </button>
        ) : null}
      </div>

      {toast ? <FormToast message={toast} onDismiss={() => setToast(null)} /> : null}
      {error && !toast ? (
        <p className="mt-3 text-xs text-stone-400">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 text-xs text-stone-300">{message}</p>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {!isEditing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="mt-5 space-y-5"
          >
            {!hasPartnerData ? (
              <p className="rounded-sm border border-dashed border-zinc-800 bg-zinc-950 px-4 py-5 text-center text-sm text-stone-500">
                Henüz partner bilgisi eklenmemiş.{" "}
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="text-stone-300 underline underline-offset-2 hover:text-stone-300"
                >
                  Düzenle
                </button>{" "}
                ile ekleyebilirsiniz.
              </p>
            ) : (
              <ViewFieldGroup title="Partner Profili · Natal Veri">
                <ViewField label="Partner Adı" value={partnerForm.partnerName || "—"} />
                <ViewField
                  label="Doğum Tarihi"
                  value={formatDisplayDate(partnerForm.partnerBirthDate)}
                />
                <ViewField
                  label="Doğum Saati"
                  value={formatDisplayTime(partnerForm.partnerBirthTime)}
                />
                <ViewField
                  label="Doğum Yeri"
                  value={partnerForm.partnerBirthPlace || "—"}
                />
              </ViewFieldGroup>
            )}

            <ViewFieldGroup title="Astro-Bağ · Ek Bilgiler">
              <ViewField
                label="İlişki Durumu"
                value={bondForm.relationshipStatus || "—"}
              />
              <ViewField
                label="Tanışma Tarihi"
                value={
                  bondForm.partnerMeetingDate.trim()
                    ? formatDisplayDate(bondForm.partnerMeetingDate)
                    : "Belirtilmedi"
                }
              />
            </ViewFieldGroup>
          </motion.div>
        ) : (
          <motion.form
            key="edit"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            onSubmit={handleSubmit}
            className="mt-5 space-y-5"
          >
            <div className="space-y-3 border-b border-zinc-800 pb-5">
              <p className={compactLabelClass}>Partner Profili · Natal Veri</p>

              <label className="block">
                <span className={compactLabelClass}>Partner Adı</span>
                <input
                  type="text"
                  value={partnerForm.partnerName}
                  onChange={(event) =>
                    updatePartnerField("partnerName", event.target.value)
                  }
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

              <p className="text-[10px] leading-relaxed text-stone-300">
                Doğum saati bilinmiyorsa en yakın tahmini girin; yükselen derecesi buna göre
                değişir.
              </p>

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
                <span className="mt-1 block text-[10px] text-white/35">
                  Opsiyonel — ilişki zaman çizelgesi için
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={isSaving || isProfileLoading}
                className={`${noirPrimaryButtonClass} flex-1 text-xs disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className={`${noirSecondaryButtonClass} flex-1 text-xs disabled:opacity-50`}
              >
                İptal
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <Link
        href="/dashboard/bonds"
        className="mt-5 inline-flex text-xs uppercase tracking-[0.18em] text-stone-300 hover:text-stone-300"
      >
        Bonds sekmesinde uyumluluk analizi →
      </Link>
    </motion.section>
  );
}
