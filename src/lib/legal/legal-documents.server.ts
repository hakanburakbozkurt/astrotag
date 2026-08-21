import "server-only";

import fs from "fs/promises";
import path from "path";
import {
  isLegalDocumentSlug,
  type LegalDocumentSlug,
} from "@/lib/legal/legal-document-slugs";

const DOCS_DIR = path.join(process.cwd(), "docs", "legal");

type DocumentConfig = {
  title: string;
  file: string;
  sectionStart?: string;
  sectionEnd?: string;
};

const SLUG_CONFIG: Record<LegalDocumentSlug, DocumentConfig> = {
  "mesafeli-satis": {
    title: "Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu",
    file: "01-mesafeli-satis-ve-on-bilgilendirme.md",
  },
  "cayma-hakki": {
    title: "Cayma Hakkı ve İade Politikası",
    file: "03-iade-ve-iptal-politikasi.md",
  },
  "dijital-ifa": {
    title: "Dijital İçerik Onayı — Anında İfa",
    file: "01-mesafeli-satis-ve-on-bilgilendirme.md",
    sectionStart: "### 8. Dijital Onay",
    sectionEnd: "---",
  },
};

function extractSection(
  content: string,
  startHeading: string,
  endMarker?: string
): string {
  const startIdx = content.indexOf(startHeading);
  if (startIdx === -1) {
    return content;
  }

  if (!endMarker) {
    return content.slice(startIdx).trim();
  }

  const endIdx = content.indexOf(endMarker, startIdx + startHeading.length);
  if (endIdx === -1) {
    return content.slice(startIdx).trim();
  }

  return content.slice(startIdx, endIdx).trim();
}

export async function getLegalDocument(slug: LegalDocumentSlug): Promise<{
  title: string;
  markdown: string;
} | null> {
  const config = SLUG_CONFIG[slug];
  const filePath = path.join(DOCS_DIR, config.file);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }

  const body = config.sectionStart
    ? extractSection(raw, config.sectionStart, config.sectionEnd)
    : raw;

  return {
    title: config.title,
    markdown: body,
  };
}

export async function resolveLegalDocumentSlug(
  slug: string
): Promise<ReturnType<typeof getLegalDocument>> {
  if (!isLegalDocumentSlug(slug)) {
    return null;
  }
  return getLegalDocument(slug);
}
