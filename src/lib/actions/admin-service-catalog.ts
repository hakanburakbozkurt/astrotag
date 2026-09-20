"use server";

import { requireAdminUser } from "@/lib/admin/admin-auth.server";
import type { ServiceCatalogCategory } from "@/lib/experts/service-catalog.shared";
import { slugifyCatalogTitle } from "@/lib/experts/service-catalog.shared";
import { createServiceRoleClient } from "@/lib/supabase/service";

type CategoryRow = {
  id: string;
  slug: string;
  title: string;
  sort_order: number;
  image_url: string | null;
  is_active: boolean;
};

type TypeRow = {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  description: string;
  default_crystal_price: number;
  default_duration_minutes: number;
  sort_order: number;
  is_active: boolean;
};

function mapCatalog(
  categories: CategoryRow[],
  types: TypeRow[]
): ServiceCatalogCategory[] {
  const typesByCategory = new Map<string, TypeRow[]>();

  for (const type of types) {
    const bucket = typesByCategory.get(type.category_id) ?? [];
    bucket.push(type);
    typesByCategory.set(type.category_id, bucket);
  }

  return categories
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      title: category.title,
      sortOrder: category.sort_order,
      imageUrl: category.image_url,
      isActive: category.is_active,
      types: (typesByCategory.get(category.id) ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((type) => ({
          id: type.id,
          slug: type.slug,
          title: type.title,
          description: type.description,
          defaultCrystalPrice: type.default_crystal_price,
          defaultDurationMinutes: type.default_duration_minutes,
          isActive: type.is_active,
          sortOrder: type.sort_order,
        })),
    }));
}

export async function listAdminServiceCatalogAction(): Promise<
  | { ok: true; catalog: ServiceCatalogCategory[] }
  | { ok: false; error: string }
> {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    return { ok: false, error: admin.error };
  }

  const supabase = createServiceRoleClient();
  const [{ data: categories, error: categoryError }, { data: types, error: typeError }] =
    await Promise.all([
      supabase
        .from("expert_service_categories")
        .select("id, slug, title, sort_order, image_url, is_active")
        .order("sort_order"),
      supabase
        .from("expert_service_types")
        .select(
          "id, category_id, slug, title, description, default_crystal_price, default_duration_minutes, sort_order, is_active"
        )
        .order("sort_order"),
    ]);

  if (categoryError || typeError) {
    return { ok: false, error: categoryError?.message ?? typeError?.message ?? "Katalog yüklenemedi." };
  }

  return {
    ok: true,
    catalog: mapCatalog(
      (categories ?? []) as CategoryRow[],
      (types ?? []) as TypeRow[]
    ),
  };
}

export async function upsertServiceCategoryAction(input: {
  id?: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    return { ok: false, error: admin.error };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Kategori başlığı zorunludur." };
  }

  const supabase = createServiceRoleClient();

  if (input.id) {
    const { error } = await supabase
      .from("expert_service_categories")
      .update({
        title,
        sort_order: Math.max(0, input.sortOrder),
        is_active: input.isActive,
        image_url: input.imageUrl?.trim() || null,
      })
      .eq("id", input.id);

    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await supabase.from("expert_service_categories").insert({
    title,
    slug: slugifyCatalogTitle(title),
    sort_order: Math.max(0, input.sortOrder),
    is_active: input.isActive,
    image_url: input.imageUrl?.trim() || null,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function upsertServiceTypeAction(input: {
  id?: string;
  categoryId: string;
  title: string;
  description: string;
  defaultCrystalPrice: number;
  defaultDurationMinutes: number;
  sortOrder: number;
  isActive: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    return { ok: false, error: admin.error };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Hizmet tipi başlığı zorunludur." };
  }

  const supabase = createServiceRoleClient();

  if (input.id) {
    const { error } = await supabase
      .from("expert_service_types")
      .update({
        category_id: input.categoryId,
        title,
        description: input.description.trim(),
        default_crystal_price: Math.max(1, input.defaultCrystalPrice),
        default_duration_minutes: Math.max(15, input.defaultDurationMinutes),
        sort_order: Math.max(0, input.sortOrder),
        is_active: input.isActive,
      })
      .eq("id", input.id);

    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await supabase.from("expert_service_types").insert({
    category_id: input.categoryId,
    title,
    slug: slugifyCatalogTitle(title),
    description: input.description.trim(),
    default_crystal_price: Math.max(1, input.defaultCrystalPrice),
    default_duration_minutes: Math.max(15, input.defaultDurationMinutes),
    sort_order: Math.max(0, input.sortOrder),
    is_active: input.isActive,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
