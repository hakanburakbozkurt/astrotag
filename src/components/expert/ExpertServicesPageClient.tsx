"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ExpertServiceManager from "@/components/expert/ExpertServiceManager";
import TabPageScaffold from "@/components/navigation/TabPageScaffold";
import {
  getExpertPanelDataAction,
  type ExpertPanelData,
} from "@/lib/actions/expert-panel";
import { EXPERT_APPROVAL_APPROVED } from "@/lib/expert/expert-approval.shared";

export default function ExpertServicesPageClient() {
  const [data, setData] = useState<ExpertPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      <TabPageScaffold
        eyebrow="Uzman"
        title="Hizmet Yönetimi"
        description="Hizmet kartlarınızı oluşturun ve düzenleyin."
      >
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      </TabPageScaffold>
    );
  }

  if (!data?.isExpert) {
    return (
      <TabPageScaffold
        eyebrow="Uzman"
        title="Hizmet Yönetimi"
        description="Bu sayfa yalnızca uzman hesapları içindir."
      >
        <p className="text-sm text-zinc-500">Uzman hesabınız bulunmuyor.</p>
      </TabPageScaffold>
    );
  }

  if (data.approvalStatus !== EXPERT_APPROVAL_APPROVED) {
    return (
      <TabPageScaffold
        eyebrow="Uzman"
        title="Hizmet Yönetimi"
        description="Admin onayı sonrası hizmet kartı ekleyebilirsiniz."
      >
        <p className="text-sm text-zinc-500">
          Hesabınız henüz onaylanmadı. Onay sonrası bu sayfadan hizmet ekleyebilirsiniz.
        </p>
        <Link
          href="/dashboard/profile"
          className="mt-4 inline-flex text-[11px] uppercase tracking-wider text-zinc-400 underline decoration-zinc-700 underline-offset-2"
        >
          Uzman paneline dön →
        </Link>
      </TabPageScaffold>
    );
  }

  return (
    <TabPageScaffold
      eyebrow="Uzman"
      title="Hizmet Ekle / Yönet"
      description="Vitrinde sergilenecek hizmet kartlarınızı buradan yönetin."
    >
      <div className="rounded-sm border border-zinc-800 bg-[#09090b] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-serif text-lg text-zinc-100">{data.displayName}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {data.services.length} hizmet kartı · vitrin:{" "}
              {data.isPublished ? "yayında" : "taslak"}
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="text-[11px] uppercase tracking-wider text-zinc-500 underline decoration-zinc-800 underline-offset-2"
          >
            Uzman paneli
          </Link>
        </div>

        <ExpertServiceManager
          embedded
          services={data.services}
          onChanged={load}
          onError={(value) => {
            setError(value);
            setMessage(null);
          }}
        />

        {message ? <p className="mt-4 text-xs text-zinc-300">{message}</p> : null}
        {error ? <p className="mt-4 text-xs text-zinc-400">{error}</p> : null}
      </div>
    </TabPageScaffold>
  );
}
