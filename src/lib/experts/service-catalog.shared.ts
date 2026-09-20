export type ServiceCatalogType = {
  id: string;
  slug: string;
  title: string;
  description: string;
  defaultCrystalPrice: number;
  defaultDurationMinutes: number;
  isActive: boolean;
  sortOrder: number;
};

export type ServiceCatalogCategory = {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  imageUrl: string | null;
  isActive: boolean;
  types: ServiceCatalogType[];
};

export function slugifyCatalogTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[ıİ]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
