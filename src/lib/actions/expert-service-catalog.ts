"use server";

import type { ServiceCatalogCategory } from "@/lib/experts/service-catalog.shared";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function listActiveServiceCatalogAction(): Promise<
  ServiceCatalogCategory[]
> {
  const supabase = createServiceRoleClient();

  const [{ data: categories }, { data: types }] = await Promise.all([
    supabase
      .from("expert_service_categories")
      .select("id, slug, title, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("expert_service_types")
      .select(
        "id, category_id, slug, title, description, default_crystal_price, default_duration_minutes, sort_order, is_active"
      )
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const typesByCategory = new Map<string, ServiceCatalogCategory["types"]>();

  for (const type of types ?? []) {
    const bucket = typesByCategory.get(type.category_id) ?? [];
    bucket.push({
      id: type.id,
      slug: type.slug,
      title: type.title,
      description: type.description,
      defaultCrystalPrice: type.default_crystal_price,
      defaultDurationMinutes: type.default_duration_minutes,
      isActive: type.is_active,
      sortOrder: type.sort_order,
    });
    typesByCategory.set(type.category_id, bucket);
  }

  return (categories ?? []).map((category) => ({
    id: category.id,
    slug: category.slug,
    title: category.title,
    sortOrder: category.sort_order,
    isActive: category.is_active,
    types: (typesByCategory.get(category.id) ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder
    ),
  }));
}
