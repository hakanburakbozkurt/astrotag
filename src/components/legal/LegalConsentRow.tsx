"use client";

import type { LegalDocumentSlug } from "@/lib/legal/legal-document-slugs";

type LegalConsentRowProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  documentSlug: LegalDocumentSlug;
  linkLabel: string;
  suffix: string;
  onOpenDocument: (slug: LegalDocumentSlug) => void;
};

export default function LegalConsentRow({
  checked,
  onCheckedChange,
  documentSlug,
  linkLabel,
  suffix,
  onOpenDocument,
}: LegalConsentRowProps) {
  return (
    <div className="flex min-h-11 items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-violet-400"
        aria-label={`${linkLabel} onayı`}
      />
      <p className="text-[11px] leading-relaxed text-white/65">
        <button
          type="button"
          onClick={() => onOpenDocument(documentSlug)}
          className="text-left font-medium text-violet-300/90 underline decoration-violet-400/40 underline-offset-2 transition hover:text-violet-200 hover:decoration-violet-300/70"
        >
          {linkLabel}
        </button>
        {suffix}
      </p>
    </div>
  );
}
