"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getExpertPanelDataAction,
  saveExpertProfileAction,
  upsertExpertArticleAction,
  type ExpertPanelData,
} from "@/lib/actions/expert-panel";
import { EXPERT_APPROVAL_PENDING } from "@/lib/expert/expert-approval.shared";
import ExpertPendingApprovalScreen from "@/components/expert/ExpertPendingApprovalScreen";
import ExpertProfileEditForm from "@/components/expert/ExpertProfileEditForm";
import ExpertServiceManager from "@/components/expert/ExpertServiceManager";
import Link from "next/link";

type ExpertPanelTab = "profile" | "services";

const PANEL_TABS: { id: ExpertPanelTab; label: string }[] = [
  { id: "profile", label: "Profil" },
  { id: "services", label: "Hizmet Kartları" },
];

const inputClass =
  "mt-1 w-full rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600";

export default function ExpertPanelSection() {
  const [data, setData] = useState<ExpertPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ExpertPanelTab>("profile");
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
      <section className="rounded-sm border border-zinc-800 bg-[#09090b] p-5">
        <p className="text-sm text-zinc-500">Uzman paneli yükleniyor…</p>
      </section>
    );
  }

  if (!data?.isExpert) {
    return null;
  }

  if (data.approvalStatus === EXPERT_APPROVAL_PENDING) {
    return (
      <>
        <ExpertPendingApprovalScreen displayName={data.displayName} />
        <section className="mt-4 rounded-sm border border-zinc-800 bg-[#09090b] p-5 sm:p-6">
          <ExpertProfileEditForm />
        </section>
      </>
    );
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

  const activeServiceCount = data.services.filter((service) => service.isActive).length;

  return (
    <section className="rounded-sm border border-zinc-800 bg-[#09090b] p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
        Uzman Paneli
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        Profilinizi düzenleyin, hizmet kartlarınızı yönetin. Yayınla → Uzmanlar
        sekmesinde görünür.
      </p>
      <p className="mt-2 font-mono text-xs text-zinc-400">
        Hakediş: ₺{data.earningsBalanceTry.toLocaleString("tr-TR")}
      </p>

      <div className="mt-5 flex w-full min-w-0 gap-2 rounded-sm border border-zinc-800 p-1">
        {PANEL_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const countLabel =
            tab.id === "services" && data.services.length > 0
              ? ` (${activeServiceCount}/${data.services.length})`
              : "";

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-sm px-3 py-2 text-xs transition ${
                isActive
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-400"
              }`}
            >
              {tab.label}
              {countLabel}
            </button>
          );
        })}
      </div>

      {activeTab === "profile" ? (
        <div className="mt-5 space-y-4">
          <ExpertProfileEditForm />

          <Link
            href="/dashboard/expert-requests"
            className="inline-flex text-[11px] uppercase tracking-wider text-zinc-400 underline decoration-zinc-700 underline-offset-2"
          >
            Danışmanlık talepleri →
          </Link>

          <div className="space-y-3">
            <label className="block text-[10px] uppercase tracking-wider text-zinc-600">
              Görünen Ad
              <input
                className={inputClass}
                value={data.displayName}
                onChange={(e) =>
                  setData({ ...data, displayName: e.target.value })
                }
              />
            </label>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-600">
              Unvan
              <input
                className={inputClass}
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
              />
            </label>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-600">
              Ekol (Vedic, Tarot…)
              <input
                className={inputClass}
                value={data.tradition}
                onChange={(e) =>
                  setData({ ...data, tradition: e.target.value })
                }
              />
            </label>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-600">
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
            <label className="block text-[10px] uppercase tracking-wider text-zinc-600">
              Hakkımda
              <textarea
                rows={3}
                className={inputClass}
                value={data.aboutText}
                onChange={(e) => setData({ ...data, aboutText: e.target.value })}
              />
            </label>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-600">
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
            <label className="flex items-center gap-2 text-xs text-zinc-400">
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

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveProfile()}
              className="rounded-sm border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs uppercase tracking-wider text-zinc-200"
            >
              Profili Kaydet
            </button>
            <button
              type="button"
              onClick={() => void addArticle()}
              className="rounded-sm border border-zinc-800 px-4 py-2 text-xs uppercase tracking-wider text-zinc-500"
            >
              + Yazı
            </button>
          </div>

          <p className="text-[10px] text-zinc-600">
            {data.articles.length} yazı · {data.services.length} hizmet kartı
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <ExpertServiceManager
            embedded
            services={data.services}
            onChanged={load}
            onError={(message) => setError(message)}
          />
        </div>
      )}

      {message ? <p className="mt-4 text-xs text-zinc-300">{message}</p> : null}
      {error ? <p className="mt-4 text-xs text-zinc-400">{error}</p> : null}
    </section>
  );
}
