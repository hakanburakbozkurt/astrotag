/** Checkout / consent UI — yasal metin modal slug'ları (client-safe) */

export const LEGAL_DOCUMENT_SLUGS = [
  "mesafeli-satis",
  "cayma-hakki",
  "dijital-ifa",
] as const;

export type LegalDocumentSlug = (typeof LEGAL_DOCUMENT_SLUGS)[number];

export const LEGAL_DOCUMENT_LABELS: Record<LegalDocumentSlug, string> = {
  "mesafeli-satis": "Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu",
  "cayma-hakki": "Cayma Hakkı",
  "dijital-ifa": "Dijital İçerik Onayı",
};

export function isLegalDocumentSlug(value: string): value is LegalDocumentSlug {
  return (LEGAL_DOCUMENT_SLUGS as readonly string[]).includes(value);
}
