"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getExpertPanelDataAction,
  saveExpertProfileAction,
  upsertExpertArticleAction,
  upsertExpertServiceAction,
  type ExpertPanelData,
} from "@/lib/actions/expert-panel";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white/90 outline-none focus:border-amber-400/30";

export default function ExpertPanelSection() {
  const [data, setData] = useState<ExpertPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const panel = await getExpertPanelDataAction();
    setData(panel);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5">
        <p className="text-sm text-white/45">Uzman paneli yükleniyor…</p>
      </section>
    );
  }

  if (!data?.isExpert) {
    return null;
  }

  const saveProfile = async () => {
    setMessage(null);
    setError(null);
    const result = await saveExpertProfileAction({
      displayName: data.displayName,
      title: data.title,
      tradition: data.tradition,
      experienceYears: data.experienceYears,
      aboutText: data.aboutText,
      philosophyText: data.philosophyText,
      isPublished: data.isPublished,
    });

    if (result.ok) {
      setMessage("Profil kaydedildi.");
      await load();
    } else {
      setError(result.error ?? "Kayıt başarısız.");
    }
  };

  const addService = async () => {
    const result = await upsertExpertServiceAction({
      name: "30 dk Seans",
      description: "Birebir uzman seansı",
      crystalPrice: 40,
      durationMinutes: 30,
      isActive: true,
    });

    if (result.ok) {
      await load();
    } else {
      setError(result.error ?? "Hizmet eklenemedi.");
    }
  };

  const addArticle = async () => {
    const slug = `yazi-${Date.now()}`;
    const result = await upsertExpertArticleAction({
      title: "Yeni Yazı",
      slug,
      excerpt: "Kısa özet…",
      body: "Makale içeriği…",
      isPublished: false,
    });

    if (result.ok) {
      await load();
    } else {
      setError(result.error ?? "Yazı eklenemedi.");
    }
  };

  return (
    <section className="rounded-[28px] border border-emerald-400/15 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/70">
        Uzman Paneli
      </p>
      <p className="mt-2 text-xs text-white/45">
        Profil, hizmet menüsü ve yazılarınızı yönetin. Yayınla → Uzmanlar
        sekmesinde görünür.
      </p>
      <p className="mt-2 font-mono text-xs text-emerald-200/70">
        Hakediş: ₺{data.earningsBalanceTry.toLocaleString("tr-TR")}
      </p>

      <div className="mt-4 space-y-3">
        <label className="block text-[10px] uppercase tracking-wider text-white/40">
          Görünen Ad
          <input
            className={inputClass}
            value={data.displayName}
            onChange={(e) =>
              setData({ ...data, displayName: e.target.value })
            }
          />
        </label>
        <label className="block text-[10px] uppercase tracking-wider text-white/40">
          Unvan
          <input
            className={inputClass}
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
          />
        </label>
        <label className="block text-[10px] uppercase tracking-wider text-white/40">
          Ekol (Vedic, Tarot…)
          <input
            className={inputClass}
            value={data.tradition}
            onChange={(e) => setData({ ...data, tradition: e.target.value })}
          />
        </label>
        <label className="block text-[10px] uppercase tracking-wider text-white/40">
          Deneyim (yıl)
          <input
            type="number"
            min={0}
            className={inputClass}
            value={data.experienceYears}
            onChange={(e) =>
              setData({
                ...data,
                experienceYears: Number(e.target.value) || 0,
              })
            }
          />
        </label>
        <label className="block text-[10px] uppercase tracking-wider text-white/40">
          Hakkımda
          <textarea
            rows={3}
            className={inputClass}
            value={data.aboutText}
            onChange={(e) => setData({ ...data, aboutText: e.target.value })}
          />
        </label>
        <label className="block text-[10px] uppercase tracking-wider text-white/40">
          Felsefe
          <textarea
            rows={3}
            className={inputClass}
            value={data.philosophyText}
            onChange={(e) =>
              setData({ ...data, philosophyText: e.target.value })
            }
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input
            type="checkbox"
            checked={data.isPublished}
            onChange={(e) =>
              setData({ ...data, isPublished: e.target.checked })
            }
          />
          Vitrinde yayınla
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void saveProfile()}
          className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-wider text-emerald-100"
        >
          Profili Kaydet
        </button>
        <button
          type="button"
          onClick={() => void addService()}
          className="rounded-xl border border-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white/55"
        >
          + Hizmet
        </button>
        <button
          type="button"
          onClick={() => void addArticle()}
          className="rounded-xl border border-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white/55"
        >
          + Yazı
        </button>
      </div>

      <p className="mt-4 text-[10px] text-white/35">
        {data.services.length} hizmet · {data.articles.length} yazı
      </p>

      {message ? <p className="mt-3 text-xs text-emerald-300/85">{message}</p> : null}
      {error ? <p className="mt-3 text-xs text-red-300/85">{error}</p> : null}
    </section>
  );
}
