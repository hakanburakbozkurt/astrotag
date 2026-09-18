"use client";

import ManifestoStoryShare from "@/components/home/ManifestoStoryShare";
import {
 MANIFESTO_CATEGORIES,
 MANIFESTO_TECHNIQUES,
 type UserManifestoRecord,
} from "@/lib/manifesto/types";

interface ManifestoArchivePanelProps {
 manifesto: UserManifestoRecord;
 progress: number;
 userName?: string;
}

function ArchiveLayer({
 label,
 text,
 highlight = false,
}: {
 label: string;
 text: string;
 highlight?: boolean;
}) {
 if (!text.trim()) {
 return null;
 }

 return (
 <article className="rounded-sm border border-white/10 bg-[#09090b] p-4">
 <p className="text-xs text-white/40">{label}</p>
 <p
 className={`mt-3 leading-relaxed ${
 highlight
 ?"font-[family-name:var(--font-serif-display)] text-base italic text-zinc-400"
 :"text-sm text-white/75"
 }`}
 >
 {text}
 </p>
 </article>
 );
}

export default function ManifestoArchivePanel({
 manifesto,
 progress,
 userName,
}: ManifestoArchivePanelProps) {
 return (
 <section
 className="space-y-6 rounded-sm border border-white/10 bg-[#09090b] p-5 sm:p-6"
 aria-label="Manifesto arşivi"
 >
 <div>
 <div className="flex items-center justify-between gap-2 text-xs text-white/45">
 <span>
 Gün {manifesto.currentDay} / {manifesto.maxDays}
 </span>
 {manifesto.generatedToday ? (
 <span className="text-zinc-400">Bugün alındı</span>
 ) : null}
 </div>
 <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
 <div
 className="h-full rounded-full bg-zinc-900/40 transition-all"
 style={{ width: `${progress}%` }}
 />
 </div>
 </div>

 {manifesto.presentation ? (
 <div className="space-y-4">
 <ArchiveLayer label="Gökyüzü kapısı" text={manifesto.presentation.cosmicHook} />
 <ArchiveLayer label="Harita aynası" text={manifesto.presentation.natalMirror} />
 <ArchiveLayer
 label="Manifesto"
 text={manifesto.presentation.manifestoClaim}
 highlight
 />
 <ArchiveLayer label="Ritüel fısıltısı" text={manifesto.presentation.ritualWhisper} />
 </div>
 ) : manifesto.lastMessage ? (
 <blockquote className="rounded-sm border border-white/10 bg-[#09090b] p-4 font-[family-name:var(--font-serif-display)] text-sm italic leading-relaxed text-zinc-400">
 “{manifesto.lastMessage}”
 </blockquote>
 ) : null}

 {manifesto.isComplete ? (
 <p className="text-xs text-white/45">
 Döngü tamamlandı. Yarın yeni bir seriye başlayabilirsin.
 </p>
 ) : null}

 {manifesto.presentation ? (
 <section className="rounded-sm border border-white/10 bg-[#09090b] p-4">
 <p className="mb-4 text-xs text-white/40">Story · 9:16</p>
 <ManifestoStoryShare
 presentation={manifesto.presentation}
 userName={userName}
 categoryLabel={
 MANIFESTO_CATEGORIES.find((c) => c.id === manifesto.category)?.label
 }
 cycleLabel={`Gün ${manifesto.currentDay} / ${manifesto.maxDays} · ${
 MANIFESTO_TECHNIQUES.find((t) => t.id === manifesto.techniqueType)?.label ??
 manifesto.techniqueType
 }`}
 />
 </section>
 ) : null}
 </section>
 );
}
