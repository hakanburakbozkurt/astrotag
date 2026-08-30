"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getExpertProfileEditDataAction,
  saveExpertProfileFieldsAction,
  uploadExpertAvatarAction,
  type ExpertProfileEditData,
} from "@/lib/actions/expert-profile";
import ExpertAvatar from "@/components/experts/ExpertAvatar";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white/90 outline-none focus:border-emerald-400/30";

export default function ExpertProfileEditForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<ExpertProfileEditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const editData = await getExpertProfileEditDataAction();
    setData(editData);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <p className="text-sm text-white/45">Profil düzenleme yükleniyor…</p>
    );
  }

  if (!data) {
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    const result = await saveExpertProfileFieldsAction({
      about: data.about,
      experienceText: data.experienceText,
      phoneNumber: data.phoneNumber,
    });

    if (result.ok) {
      setMessage("Profil bilgileri kaydedildi.");
      await load();
    } else {
      setError(result.error);
    }

    setSaving(false);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.set("avatar", file);

    const result = await uploadExpertAvatarAction(formData);
    if (result.ok) {
      setData((current) =>
        current ? { ...current, avatarUrl: result.avatarUrl } : current
      );
      setMessage("Profil fotoğrafı güncellendi.");
    } else {
      setError(result.error);
    }

    setUploading(false);
    event.target.value = "";
  };

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">
          Profil Düzenleme
        </p>
        <p className="mt-1 text-xs text-white/45">
          Vitrin fotoğrafı, biyografi ve WhatsApp bildirim numaranız.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <ExpertAvatar
          avatarUrl={data.avatarUrl}
          displayName={data.about || "Uzman"}
          size="grid"
          ring={false}
        />
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => void handleAvatarChange(event)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-white/10 px-4 py-2 text-[11px] uppercase tracking-wider text-white/60 transition hover:border-emerald-400/25 disabled:opacity-50"
          >
            {uploading ? "Yükleniyor…" : "Fotoğraf Yükle"}
          </button>
        </div>
      </div>

      <label className="block text-[10px] uppercase tracking-wider text-white/40">
        Hakkımda
        <textarea
          rows={4}
          className={inputClass}
          value={data.about}
          onChange={(event) =>
            setData((current) =>
              current ? { ...current, about: event.target.value } : current
            )
          }
          placeholder="Kendinizi ve yaklaşımınızı anlatın…"
        />
      </label>

      <label className="block text-[10px] uppercase tracking-wider text-white/40">
        Tecrübe
        <textarea
          rows={3}
          className={inputClass}
          value={data.experienceText}
          onChange={(event) =>
            setData((current) =>
              current
                ? { ...current, experienceText: event.target.value }
                : current
            )
          }
          placeholder="Eğitim, uzmanlık alanları, çalışma biçiminiz…"
        />
      </label>

      <label className="block text-[10px] uppercase tracking-wider text-white/40">
        WhatsApp / Telefon (gizli)
        <input
          type="tel"
          className={inputClass}
          value={data.phoneNumber}
          onChange={(event) =>
            setData((current) =>
              current ? { ...current, phoneNumber: event.target.value } : current
            )
          }
          placeholder="05XX XXX XX XX"
          autoComplete="tel"
        />
        <span className="mt-1 block text-[10px] leading-relaxed text-white/35">
          Müşteri ödemesi sonrası bildirim almak için zorunludur. Vitrinde
          gösterilmez.
        </span>
      </label>

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-xs uppercase tracking-wider text-emerald-100 disabled:opacity-50"
      >
        {saving ? "Kaydediliyor…" : "Profil Bilgilerini Kaydet"}
      </button>

      {message ? <p className="text-xs text-emerald-300/85">{message}</p> : null}
      {error ? <p className="text-xs text-red-300/85">{error}</p> : null}
    </div>
  );
}
