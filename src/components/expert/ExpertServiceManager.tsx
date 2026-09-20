"use client";

import { useState } from "react";
import {
  deleteExpertServiceAction,
  upsertExpertServiceAction,
} from "@/lib/actions/expert-panel";

type ExpertServiceItem = {
  id: string;
  name: string;
  description: string;
  crystalPrice: number;
  durationMinutes: number;
  isActive: boolean;
};

type ExpertServiceManagerProps = {
  services: ExpertServiceItem[];
  onChanged: () => Promise<void>;
  onError: (message: string) => void;
  /** Sekme içinde kullanıldığında üst ayırıcı kaldırılır */
  embedded?: boolean;
};

const inputClass =
  "mt-1 w-full rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600";

const emptyDraft = {
  name: "",
  description: "",
  crystalPrice: 40,
  durationMinutes: 30,
  isActive: true,
};

export default function ExpertServiceManager({
  services,
  onChanged,
  onError,
  embedded = false,
}: ExpertServiceManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState(false);

  const startCreate = () => {
    setEditingId("new");
    setDraft(emptyDraft);
  };

  const startEdit = (service: ExpertServiceItem) => {
    setEditingId(service.id);
    setDraft({
      name: service.name,
      description: service.description,
      crystalPrice: service.crystalPrice,
      durationMinutes: service.durationMinutes,
      isActive: service.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      onError("Hizmet başlığı zorunludur.");
      return;
    }

    setBusy(true);
    const result = await upsertExpertServiceAction({
      id: editingId === "new" ? undefined : editingId ?? undefined,
      name: draft.name,
      description: draft.description,
      crystalPrice: draft.crystalPrice,
      durationMinutes: draft.durationMinutes,
      isActive: draft.isActive,
    });
    setBusy(false);

    if (!result.ok) {
      onError(result.error ?? "Kayıt başarısız.");
      return;
    }

    cancelEdit();
    await onChanged();
  };

  const remove = async (serviceId: string) => {
    setBusy(true);
    const result = await deleteExpertServiceAction(serviceId);
    setBusy(false);

    if (!result.ok) {
      onError(result.error ?? "Silinemedi.");
      return;
    }

    if (editingId === serviceId) {
      cancelEdit();
    }
    await onChanged();
  };

  return (
    <div className={embedded ? "mt-0" : "mt-6 border-t border-zinc-800 pt-5"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-base text-zinc-100">Hizmet Kartları</p>
          <p className="mt-1 text-xs text-zinc-500">
            Vitrinde sergilenecek seans ve danışmanlık paketleriniz.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || editingId === "new"}
          onClick={startCreate}
          className="shrink-0 rounded-sm border border-zinc-700 px-3 py-1.5 text-[11px] uppercase tracking-wider text-zinc-300 disabled:opacity-50"
        >
          + Yeni
        </button>
      </div>

      {editingId ? (
        <div className="mt-4 space-y-3 rounded-sm border border-zinc-800 bg-[#09090b] p-4">
          <label className="block text-xs text-zinc-500">
            Başlık
            <input
              className={inputClass}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Kapsam / Açıklama
            <textarea
              rows={3}
              className={inputClass}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-zinc-500">
              Kristal fiyatı
              <input
                type="number"
                min={1}
                className={inputClass}
                value={draft.crystalPrice}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    crystalPrice: Number(e.target.value) || 1,
                  })
                }
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Süre (dk)
              <input
                type="number"
                min={15}
                className={inputClass}
                value={draft.durationMinutes}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    durationMinutes: Number(e.target.value) || 15,
                  })
                }
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) =>
                setDraft({ ...draft, isActive: e.target.checked })
              }
            />
            Vitrinde aktif
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => void save()}
              className="rounded-sm border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs uppercase tracking-wider text-zinc-200 disabled:opacity-50"
            >
              {busy ? "…" : "Kaydet"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={cancelEdit}
              className="rounded-sm border border-zinc-800 px-4 py-2 text-xs uppercase tracking-wider text-zinc-500"
            >
              İptal
            </button>
          </div>
        </div>
      ) : null}

      <ul className="mt-4 space-y-2">
        {services.length === 0 ? (
          <li className="text-sm text-zinc-500">Henüz hizmet kartı yok.</li>
        ) : (
          services.map((service) => (
            <li
              key={service.id}
              className="rounded-sm border border-zinc-800 bg-[#09090b] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-sm text-zinc-100">
                    {service.name}
                    {!service.isActive ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-zinc-600">
                        Pasif
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {service.description || "Açıklama eklenmemiş."}
                  </p>
                  <p className="mt-2 font-mono text-xs text-zinc-400">
                    {service.crystalPrice} kristal · {service.durationMinutes} dk
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => startEdit(service)}
                    className="rounded-sm border border-zinc-800 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-400"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void remove(service.id)}
                    className="rounded-sm border border-zinc-800 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-600"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
