"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteExpertServiceAction,
  uploadExpertServiceImageAction,
  upsertExpertServiceAction,
} from "@/lib/actions/expert-panel";
import { listActiveServiceCatalogAction } from "@/lib/actions/expert-service-catalog";
import type { ServiceCatalogCategory } from "@/lib/experts/service-catalog.shared";
import { formatCrystalPriceLabel } from "@/lib/payments/commission.shared";

type ExpertServiceItem = {
  id: string;
  name: string;
  description: string;
  crystalPrice: number;
  durationMinutes: number;
  isActive: boolean;
  imageUrl: string | null;
  serviceTypeId: string | null;
};

type ExpertServiceManagerProps = {
  services: ExpertServiceItem[];
  onChanged: () => Promise<void>;
  onError: (message: string) => void;
  embedded?: boolean;
};

const inputClass =
  "mt-1 w-full rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600";

const selectClass =
  "mt-1 w-full rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600";

type ServiceDraft = {
  serviceTypeId: string;
  categoryId: string;
  name: string;
  description: string;
  crystalPrice: number;
  durationMinutes: number;
  isActive: boolean;
  imageUrl: string | null;
};

function findTypeMeta(
  catalog: ServiceCatalogCategory[],
  serviceTypeId: string | null
): { categoryTitle: string; typeTitle: string } | null {
  if (!serviceTypeId) {
    return null;
  }

  for (const category of catalog) {
    const type = category.types.find((row) => row.id === serviceTypeId);
    if (type) {
      return { categoryTitle: category.title, typeTitle: type.title };
    }
  }

  return null;
}

export default function ExpertServiceManager({
  services,
  onChanged,
  onError,
  embedded = false,
}: ExpertServiceManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [catalog, setCatalog] = useState<ServiceCatalogCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ServiceDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    const rows = await listActiveServiceCatalogAction();
    setCatalog(rows);
    setCatalogLoading(false);
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const selectedCategory = useMemo(
    () => catalog.find((category) => category.id === draft?.categoryId) ?? null,
    [catalog, draft?.categoryId]
  );

  const availableTypes = selectedCategory?.types ?? [];

  const resetDraft = () => {
    setEditingId(null);
    setDraft(null);
  };

  const startCreate = () => {
    const firstCategory = catalog[0];
    const firstType = firstCategory?.types[0];

    if (!firstCategory || !firstType) {
      onError("Henüz tanımlı hizmet kataloğu yok. Admin panelinden kategori ekleyin.");
      return;
    }

    setEditingId("new");
    setDraft({
      categoryId: firstCategory.id,
      serviceTypeId: firstType.id,
      name: firstType.title,
      description: firstType.description,
      crystalPrice: firstType.defaultCrystalPrice,
      durationMinutes: firstType.defaultDurationMinutes,
      isActive: true,
      imageUrl: null,
    });
  };

  const startEdit = (service: ExpertServiceItem) => {
    const meta = findTypeMeta(catalog, service.serviceTypeId);
    const category =
      catalog.find((row) =>
        row.types.some((type) => type.id === service.serviceTypeId)
      ) ?? catalog[0];

    setEditingId(service.id);
    setDraft({
      categoryId: category?.id ?? "",
      serviceTypeId: service.serviceTypeId ?? category?.types[0]?.id ?? "",
      name: service.name,
      description: service.description,
      crystalPrice: service.crystalPrice,
      durationMinutes: service.durationMinutes,
      isActive: service.isActive,
      imageUrl: service.imageUrl,
    });

    if (!meta && !service.serviceTypeId) {
      onError("Bu kart eski formatta; lütfen kategori ve tip seçerek yeniden kaydedin.");
    }
  };

  const applyTypeDefaults = (categoryId: string, serviceTypeId: string) => {
    const category = catalog.find((row) => row.id === categoryId);
    const type = category?.types.find((row) => row.id === serviceTypeId);
    if (!type) {
      return;
    }

    setDraft((current) =>
      current
        ? {
            ...current,
            categoryId,
            serviceTypeId,
            name: type.title,
            description: type.description,
            crystalPrice: type.defaultCrystalPrice,
            durationMinutes: type.defaultDurationMinutes,
          }
        : current
    );
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.set("image", file);

    const result = await uploadExpertServiceImageAction(formData);
    setUploadingImage(false);
    event.target.value = "";

    if (!result.ok) {
      onError(result.error);
      return;
    }

    setDraft((current) =>
      current ? { ...current, imageUrl: result.imageUrl } : current
    );
  };

  const save = async () => {
    if (!draft?.name.trim()) {
      onError("Hizmet başlığı zorunludur.");
      return;
    }

    if (!draft.serviceTypeId) {
      onError("Lütfen bir hizmet tipi seçin.");
      return;
    }

    setBusy(true);
    const result = await upsertExpertServiceAction({
      id: editingId === "new" ? undefined : editingId ?? undefined,
      serviceTypeId: draft.serviceTypeId,
      name: draft.name,
      description: draft.description,
      crystalPrice: draft.crystalPrice,
      durationMinutes: draft.durationMinutes,
      isActive: draft.isActive,
      imageUrl: draft.imageUrl,
    });
    setBusy(false);

    if (!result.ok) {
      onError(result.error ?? "Kayıt başarısız.");
      return;
    }

    resetDraft();
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
      resetDraft();
    }
    await onChanged();
  };

  return (
    <div className={embedded ? "mt-0" : "mt-6 border-t border-zinc-800 pt-5"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-base text-zinc-100">Hizmet Kartları</p>
          <p className="mt-1 text-xs text-zinc-500">
            Kategori ve hizmet tipini seçin; alanlar otomatik dolar. Fiyatı özelleştirip
            kartınızı oluşturun.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || editingId === "new" || catalogLoading || catalog.length === 0}
          onClick={startCreate}
          className="shrink-0 rounded-sm border border-zinc-700 px-3 py-1.5 text-[11px] uppercase tracking-wider text-zinc-300 disabled:opacity-50"
        >
          + Yeni
        </button>
      </div>

      {catalogLoading ? (
        <p className="mt-4 text-sm text-zinc-500">Hizmet kataloğu yükleniyor…</p>
      ) : catalog.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          Aktif hizmet kataloğu bulunamadı. Admin panelinden kategori ve alt tipler
          tanımlanmalıdır.
        </p>
      ) : null}

      {editingId && draft ? (
        <div className="mt-4 space-y-3 rounded-sm border border-zinc-800 bg-[#09090b] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs text-zinc-500">
              Ana kategori
              <select
                className={selectClass}
                value={draft.categoryId}
                onChange={(e) => {
                  const categoryId = e.target.value;
                  const nextType =
                    catalog.find((row) => row.id === categoryId)?.types[0]?.id ?? "";
                  if (nextType) {
                    applyTypeDefaults(categoryId, nextType);
                  } else {
                    setDraft({ ...draft, categoryId, serviceTypeId: "" });
                  }
                }}
              >
                {catalog.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-zinc-500">
              Hizmet tipi
              <select
                className={selectClass}
                value={draft.serviceTypeId}
                onChange={(e) =>
                  applyTypeDefaults(draft.categoryId, e.target.value)
                }
              >
                {availableTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs text-zinc-500">
            Başlık
            <input
              className={inputClass}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Açıklama
            <textarea
              rows={3}
              className={inputClass}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </label>

          <div>
            <p className="text-xs text-zinc-500">Görsel / İllüstrasyon</p>
            <div className="mt-2 flex flex-wrap items-start gap-3">
              <div className="h-24 w-36 overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900">
                {draft.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-[10px] uppercase tracking-wider text-zinc-700">
                    Görsel yok
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => void handleImageChange(event)}
                />
                <button
                  type="button"
                  disabled={uploadingImage || busy}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-sm border border-zinc-800 px-3 py-1.5 text-[11px] uppercase tracking-wider text-zinc-400 disabled:opacity-50"
                >
                  {uploadingImage ? "Yükleniyor…" : "Görsel Yükle"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <span className="mt-1 block font-mono text-[11px] text-zinc-600">
                {formatCrystalPriceLabel(draft.crystalPrice)}
              </span>
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
              disabled={busy || uploadingImage}
              onClick={() => void save()}
              className="rounded-sm border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs uppercase tracking-wider text-zinc-200 disabled:opacity-50"
            >
              {busy ? "…" : "Kaydet"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={resetDraft}
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
          services.map((service) => {
            const meta = findTypeMeta(catalog, service.serviceTypeId);
            return (
              <li
                key={service.id}
                className="overflow-hidden rounded-sm border border-zinc-800 bg-[#09090b]"
              >
                <div className="flex">
                  <div className="h-24 w-28 shrink-0 bg-zinc-900">
                    {service.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={service.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-[10px] uppercase tracking-wider text-zinc-700">
                        Görsel yok
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      {meta ? (
                        <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                          {meta.categoryTitle} · {meta.typeTitle}
                        </p>
                      ) : null}
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
                        {formatCrystalPriceLabel(service.crystalPrice)} ·{" "}
                        {service.durationMinutes} dk
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
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
