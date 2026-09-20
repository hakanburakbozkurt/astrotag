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
  "mt-1 w-full rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600";

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
    return <p className="text-sm text-zinc-500">Profil düzenleme yükleniyor…</p>;
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
    <div className="mt-4 space-y-5 rounded-sm border border-zinc-800 bg-[#09090b] p-4 sm:p-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">
          Profil Düzenleme
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Kare profil fotoğrafı, biyografi ve WhatsApp bildirim numaranız.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <ExpertAvatar
          avatarUrl={data.avatarUrl}
          displayName={data.displayName}
          size="profile"
          ring={false}
        />
        <div className="min-w-0 space-y-2">
          <p className="font-serif text-sm text-zinc-300">{data.displayName}</p>
          <p className="text-xs text-zinc-600">
            JPEG, PNG veya WebP · en fazla 5 MB · kare görsel önerilir
          </p>
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
            className="rounded-sm border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50"
          >
            {uploading ? "Yükleniyor…" : "Profil Fotoğrafı Yükle"}
          </button>
        </div>
      </div>

      <label className="block text-[10px] uppercase tracking-wider text-zinc-600">
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

      <label className="block text-[10px] uppercase tracking-wider text-zinc-600">
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

      <label className="block text-[10px] uppercase tracking-wider text-zinc-600">
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
        <span className="mt-1 block text-[10px] leading-relaxed text-zinc-600">
          Müşteri ödemesi sonrası bildirim almak için zorunludur. Vitrinde
          gösterilmez.
        </span>
      </label>

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="rounded-sm border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs uppercase tracking-wider text-zinc-300 disabled:opacity-50"
      >
        {saving ? "Kaydediliyor…" : "Profil Bilgilerini Kaydet"}
      </button>

      {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
      {error ? <p className="text-xs text-zinc-500">{error}</p> : null}
    </div>
  );
}
