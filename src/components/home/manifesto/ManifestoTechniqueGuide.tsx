"use client";

import {
 MANIFESTO_TECHNIQUES,
 type ManifestoTechniqueId,
} from "@/lib/manifesto/types";

interface ManifestoTechniqueGuideProps {
 techniqueId: ManifestoTechniqueId;
}

export default function ManifestoTechniqueGuide({
 techniqueId,
}: ManifestoTechniqueGuideProps) {
 const technique = MANIFESTO_TECHNIQUES.find((item) => item.id === techniqueId);

 if (!technique) {
 return null;
 }

 return (
 <div
 className="border border-zinc-800 bg-[#09090b] px-3 py-3 sm:px-4"
 role="note"
 aria-live="polite"
 >
 <div className="flex items-baseline justify-between gap-3">
 <p className="text-xs font-medium text-zinc-300">{technique.label}</p>
 <p className="shrink-0 font-mono text-[10px] text-zinc-500">
 {technique.maxDays} gün
 </p>
 </div>
 <p className="mt-1.5 text-xs leading-relaxed text-white/45">{technique.hint}</p>
 </div>
 );
}
