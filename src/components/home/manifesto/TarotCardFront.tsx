"use client";

import { motion } from"framer-motion";
import CelestialSealGraphic from "@/components/home/manifesto/CelestialSealGraphic";
import {
 manifestoCardDensityClass,
 resolveManifestoCardDensity,
} from "@/components/home/manifesto/manifesto-card-density";
import type { UserManifestoRecord } from "@/lib/manifesto/types";

interface TarotCardFrontProps {
 loading: boolean;
 error?: string | null;
 manifesto: UserManifestoRecord | null;
}

function resolvePresentationCopy(manifesto: UserManifestoRecord | null) {
 const presentation = manifesto?.presentation;

 return {
 cosmicHook:
 presentation?.cosmicHook?.trim() ||
 manifesto?.lastMessage?.trim() ||
 null,
 natalMirror: presentation?.natalMirror?.trim() || null,
 manifestoClaim:
 presentation?.manifestoClaim?.trim() ||
 (presentation?.cosmicHook ? null : manifesto?.lastMessage?.trim()) ||
 null,
 ritualWhisper: presentation?.ritualWhisper?.trim() || null,
 };
}

export default function TarotCardFront({
 loading,
 error = null,
 manifesto,
}: TarotCardFrontProps) {
 const copy = resolvePresentationCopy(manifesto);
 const density = resolveManifestoCardDensity(
 [
 copy.cosmicHook,
 copy.natalMirror,
 copy.manifestoClaim,
 copy.ritualWhisper,
 ]
 .filter(Boolean)
 .join(""),
 null,
 false
 );
 const densityClass = manifestoCardDensityClass(density);

 return (
 <div
 className={`universe-tarot-card-body universe-tarot-card-body--front visible h-full min-h-full w-full bg-[#09090b] opacity-100 ${densityClass}`}
 >
 <main
 className="universe-tarot-card-content pointer-events-auto visible text-center opacity-100"
 aria-busy={loading}
 aria-labelledby="universe-message-title"
 >
 {error ? (
 <p className="universe-tarot-card-body-text text-stone-400">{error}</p>
 ) : loading ? (
 <motion.p
 className="universe-tarot-card-headline font-[family-name:var(--font-serif-display)] italic text-white/50"
 animate={{ opacity: [0.45, 1, 0.45] }}
 transition={{ duration: 1.8, repeat: Infinity }}
 >
 Kozmik frekans hizalanıyor…
 </motion.p>
 ) : copy.cosmicHook || copy.manifestoClaim ? (
 <div className="universe-tarot-card-text-block">
 {copy.cosmicHook ? (
 <h3
 id="universe-message-title"
 className="universe-tarot-card-headline font-[family-name:var(--font-serif-display)] font-normal text-[#f5e6c8]"
 >
 {copy.cosmicHook}
 </h3>
 ) : null}

 {copy.natalMirror ? (
 <p className="universe-tarot-card-body-text text-white/55">
 {copy.natalMirror}
 </p>
 ) : null}

 {copy.manifestoClaim &&
 copy.manifestoClaim !== copy.cosmicHook ? (
 <p className="universe-tarot-card-claim font-[family-name:var(--font-serif-display)] italic text-[#f5e6c8]/92">
 {copy.manifestoClaim}
 </p>
 ) : null}

 {copy.ritualWhisper ? (
 <p className="universe-tarot-card-whisper text-white/40">
 {copy.ritualWhisper}
 </p>
 ) : null}
 </div>
 ) : (
 <p className="universe-tarot-card-body-text text-white/50">
 Mesaj henüz ulaşmadı. Lütfen tekrar dene.
 </p>
 )}
 </main>

 <footer className="universe-tarot-card-footer visible opacity-100">
 <CelestialSealGraphic className="universe-tarot-card-seal opacity-100" />
 <p className="universe-tarot-card-brand visible text-center font-mono text-zinc-500 opacity-100">
 astrotag.app
 </p>
 </footer>
 </div>
 );
}
