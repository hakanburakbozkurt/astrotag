"use client";

import { FormEvent, useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil } from "lucide-react";
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
      <dt className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </dt>
      <dd className="text-sm font-medium leading-snug text-white/88 sm:text-right">
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
      <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-amber-400/55">
        {title}
      </p>
      <dl className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
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
        className="animate-pulse rounded-[28px] border border-white/10 bg-[#0f172a]/60 p-5"
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
      className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
            Partner & Astro-Bağ
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/50">
            Partner natal verisi ve ilişki bağlamı — synastry, Nexus ve Bonds analizlerinde
            kullanılır.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleStartEditing}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-200/90 transition hover:border-amber-400/25 hover:bg-white/[0.06]"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Düzenle
          </button>
        ) : null}
      </div>

      {toast ? <FormToast message={toast} onDismiss={() => setToast(null)} /> : null}
      {error && !toast ? (
        <p className="mt-3 text-xs text-red-300/80">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 text-xs text-emerald-300/80">{message}</p>
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
              <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-center text-sm text-white/45">
                Henüz partner bilgisi eklenmemiş.{" "}
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="text-amber-300/85 underline underline-offset-2 hover:text-amber-200"
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
            <div className="space-y-3 border-b border-white/[0.06] pb-5">
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

              <p className="text-[10px] leading-relaxed text-amber-200/55">
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
                className="min-h-11 flex-1 rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="min-h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-white/65 transition hover:border-white/20 hover:bg-white/[0.05] disabled:opacity-50"
              >
                İptal
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <Link
        href="/dashboard/bonds"
        className="mt-5 inline-flex text-xs uppercase tracking-[0.18em] text-amber-300/75 hover:text-amber-200"
      >
        Bonds sekmesinde uyumluluk analizi →
      </Link>
    </motion.section>
  );
}
