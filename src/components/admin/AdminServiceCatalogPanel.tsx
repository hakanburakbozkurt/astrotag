"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  listAdminServiceCatalogAction,
  upsertServiceCategoryAction,
  upsertServiceTypeAction,
} from "@/lib/actions/admin-service-catalog";
import type { ServiceCatalogCategory } from "@/lib/experts/service-catalog.shared";
import { formatCrystalPriceLabel } from "@/lib/payments/commission.shared";

const inputClass =
  "mt-1 w-full rounded-sm border border-zinc-800 bg-[#09090b] px-2.5 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600";

type CategoryDraft = {
  title: string;
  sortOrder: number;
  isActive: boolean;
};

type TypeDraft = {
  categoryId: string;
  title: string;
  description: string;
  defaultCrystalPrice: number;
  defaultDurationMinutes: number;
  sortOrder: number;
  isActive: boolean;
};

const emptyCategoryDraft: CategoryDraft = {
  title: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminServiceCatalogPanel() {
  const [catalog, setCatalog] = useState<ServiceCatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState<string | "new" | null>(
    null
  );
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(emptyCategoryDraft);

  const [editingTypeId, setEditingTypeId] = useState<string | "new" | null>(null);
  const [typeDraft, setTypeDraft] = useState<TypeDraft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listAdminServiceCatalogAction();
    if (!result.ok) {
      setError(result.error);
      setCatalog([]);
    } else {
      setCatalog(result.catalog);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveCategory = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);

    const result = await upsertServiceCategoryAction({
      id: editingCategoryId === "new" ? undefined : editingCategoryId ?? undefined,
      title: categoryDraft.title,
      sortOrder: categoryDraft.sortOrder,
      isActive: categoryDraft.isActive,
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Kategori kaydedilemedi.");
      return;
    }

    setEditingCategoryId(null);
    setMessage("Kategori kaydedildi.");
    await load();
  };

  const saveType = async () => {
    if (!typeDraft) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    const result = await upsertServiceTypeAction({
      id: editingTypeId === "new" ? undefined : editingTypeId ?? undefined,
      categoryId: typeDraft.categoryId,
      title: typeDraft.title,
      description: typeDraft.description,
      defaultCrystalPrice: typeDraft.defaultCrystalPrice,
      defaultDurationMinutes: typeDraft.defaultDurationMinutes,
      sortOrder: typeDraft.sortOrder,
      isActive: typeDraft.isActive,
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Alt tip kaydedilemedi.");
      return;
    }

    setEditingTypeId(null);
    setTypeDraft(null);
    setMessage("Alt hizmet tipi kaydedildi.");
    await load();
  };

  const startNewCategory = () => {
    setEditingCategoryId("new");
    setCategoryDraft({
      title: "",
      sortOrder: catalog.length + 1,
      isActive: true,
    });
  };

  const startEditCategory = (category: ServiceCatalogCategory) => {
    setEditingCategoryId(category.id);
    setCategoryDraft({
      title: category.title,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
  };

  const startNewType = (categoryId: string, sortOrder: number) => {
    setEditingTypeId("new");
    setTypeDraft({
      categoryId,
      title: "",
      description: "",
      defaultCrystalPrice: 30,
      defaultDurationMinutes: 30,
      sortOrder,
      isActive: true,
    });
    setExpandedId(categoryId);
  };

  const startEditType = (
    categoryId: string,
    type: ServiceCatalogCategory["types"][number]
  ) => {
    setEditingTypeId(type.id);
    setTypeDraft({
      categoryId,
      title: type.title,
      description: type.description,
      defaultCrystalPrice: type.defaultCrystalPrice,
      defaultDurationMinutes: type.defaultDurationMinutes,
      sortOrder: type.sortOrder,
      isActive: type.isActive,
    });
    setExpandedId(categoryId);
  };

  if (loading) {
    return (
      <section className="rounded-sm border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-sm text-stone-400">Hizmet kataloğu yükleniyor…</p>
      </section>
    );
  }

  return (
    <section className="rounded-sm border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-base text-stone-200">Hizmetler Yönetimi</p>
          <p className="mt-1 text-xs text-stone-500">
            Ana kategoriler ve alt hizmet tipleri — uzman vitrini buradan beslenir.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={startNewCategory}
          className="rounded-sm border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-wider text-stone-300 disabled:opacity-50"
        >
          + Kategori
        </button>
      </div>

      {editingCategoryId ? (
        <div className="mt-4 space-y-2 rounded-sm border border-zinc-800 bg-[#09090b] p-3">
          <label className="block text-[10px] uppercase tracking-wider text-stone-500">
            Kategori başlığı
            <input
              className={inputClass}
              value={categoryDraft.title}
              onChange={(e) =>
                setCategoryDraft({ ...categoryDraft, title: e.target.value })
              }
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[10px] uppercase tracking-wider text-stone-500">
              Sıra
              <input
                type="number"
                min={0}
                className={inputClass}
                value={categoryDraft.sortOrder}
                onChange={(e) =>
                  setCategoryDraft({
                    ...categoryDraft,
                    sortOrder: Number(e.target.value) || 0,
                  })
                }
              />
            </label>
            <label className="mt-5 flex items-center gap-2 text-xs text-stone-400">
              <input
                type="checkbox"
                checked={categoryDraft.isActive}
                onChange={(e) =>
                  setCategoryDraft({
                    ...categoryDraft,
                    isActive: e.target.checked,
                  })
                }
              />
              Aktif
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveCategory()}
              className="rounded-sm border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-wider text-stone-300"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={() => setEditingCategoryId(null)}
              className="rounded-sm border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-wider text-stone-500"
            >
              İptal
            </button>
          </div>
        </div>
      ) : null}

      <ul className="mt-4 space-y-2">
        {catalog.length === 0 ? (
          <li className="text-sm text-stone-500">Henüz kategori yok.</li>
        ) : (
          catalog.map((category) => {
            const expanded = expandedId === category.id;
            return (
              <li
                key={category.id}
                className="rounded-sm border border-zinc-800 bg-[#09090b]"
              >
                <div className="flex items-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((current) =>
                        current === category.id ? null : category.id
                      )
                    }
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-stone-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-stone-500" />
                    )}
                    <span className="truncate font-serif text-sm text-stone-200">
                      {category.title}
                    </span>
                    {!category.isActive ? (
                      <span className="text-[10px] uppercase tracking-wider text-stone-600">
                        Pasif
                      </span>
                    ) : null}
                    <span className="ml-auto shrink-0 text-[10px] text-stone-600">
                      {category.types.length} tip
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => startEditCategory(category)}
                    className="rounded-sm border border-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wider text-stone-500"
                  >
                    Düzenle
                  </button>
                </div>

                {expanded ? (
                  <div className="border-t border-zinc-800 px-3 pb-3 pt-2">
                    <div className="mb-2 flex justify-end">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          startNewType(category.id, category.types.length + 1)
                        }
                        className="rounded-sm border border-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wider text-stone-500"
                      >
                        + Alt tip
                      </button>
                    </div>

                    {editingTypeId && typeDraft?.categoryId === category.id ? (
                      <div className="mb-3 space-y-2 rounded-sm border border-zinc-800 p-3">
                        <label className="block text-[10px] uppercase tracking-wider text-stone-500">
                          Alt tip başlığı
                          <input
                            className={inputClass}
                            value={typeDraft.title}
                            onChange={(e) =>
                              setTypeDraft({ ...typeDraft, title: e.target.value })
                            }
                          />
                        </label>
                        <label className="block text-[10px] uppercase tracking-wider text-stone-500">
                          Açıklama
                          <textarea
                            rows={2}
                            className={inputClass}
                            value={typeDraft.description}
                            onChange={(e) =>
                              setTypeDraft({
                                ...typeDraft,
                                description: e.target.value,
                              })
                            }
                          />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block text-[10px] uppercase tracking-wider text-stone-500">
                            Varsayılan kristal
                            <input
                              type="number"
                              min={1}
                              className={inputClass}
                              value={typeDraft.defaultCrystalPrice}
                              onChange={(e) =>
                                setTypeDraft({
                                  ...typeDraft,
                                  defaultCrystalPrice: Number(e.target.value) || 1,
                                })
                              }
                            />
                          </label>
                          <label className="block text-[10px] uppercase tracking-wider text-stone-500">
                            Süre (dk)
                            <input
                              type="number"
                              min={15}
                              className={inputClass}
                              value={typeDraft.defaultDurationMinutes}
                              onChange={(e) =>
                                setTypeDraft({
                                  ...typeDraft,
                                  defaultDurationMinutes:
                                    Number(e.target.value) || 15,
                                })
                              }
                            />
                          </label>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-stone-400">
                          <input
                            type="checkbox"
                            checked={typeDraft.isActive}
                            onChange={(e) =>
                              setTypeDraft({
                                ...typeDraft,
                                isActive: e.target.checked,
                              })
                            }
                          />
                          Aktif
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void saveType()}
                            className="rounded-sm border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-wider text-stone-300"
                          >
                            Kaydet
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTypeId(null);
                              setTypeDraft(null);
                            }}
                            className="rounded-sm border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-wider text-stone-500"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <ul className="space-y-1.5">
                      {category.types.length === 0 ? (
                        <li className="text-xs text-stone-600">Alt tip yok.</li>
                      ) : (
                        category.types.map((type) => (
                          <li
                            key={type.id}
                            className="flex items-start justify-between gap-2 rounded-sm border border-zinc-800/80 px-2.5 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-stone-300">
                                {type.title}
                                {!type.isActive ? (
                                  <span className="ml-2 text-[10px] uppercase tracking-wider text-stone-600">
                                    Pasif
                                  </span>
                                ) : null}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-stone-600">
                                {type.description}
                              </p>
                              <p className="mt-1 font-mono text-[11px] text-stone-500">
                                {formatCrystalPriceLabel(type.defaultCrystalPrice)} ·{" "}
                                {type.defaultDurationMinutes} dk
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => startEditType(category.id, type)}
                              className="shrink-0 rounded-sm border border-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wider text-stone-500"
                            >
                              Düzenle
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>

      {message ? <p className="mt-3 text-xs text-stone-400">{message}</p> : null}
      {error ? <p className="mt-3 text-xs text-stone-500">{error}</p> : null}
    </section>
  );
}
