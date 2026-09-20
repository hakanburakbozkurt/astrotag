import type { ExpertServiceRow } from "@/lib/experts/experts.server";

/** Hizmet kartı arka planı — önce uzman yüklemesi, yoksa kategori görseli */
export function resolveServiceDisplayImage(
  service: Pick<ExpertServiceRow, "imageUrl" | "categoryImageUrl">
): string | null {
  return service.imageUrl?.trim() || service.categoryImageUrl?.trim() || null;
}
