"use client";

import { useEffect, useMemo, type CSSProperties } from"react";
import { createPortal } from"react-dom";
import { AnimatePresence, motion } from"framer-motion";
import type { UserManifestoRecord } from "@/lib/manifesto/types";
import TarotCardFront from "@/components/home/manifesto/TarotCardFront";
import TarotTiltCard from "@/components/home/manifesto/TarotTiltCard";
import {
 backdropDustClass,
 createBackdropDustMatrix,
} from "@/components/home/manifesto/universe-message-backdrop-dust";
import"@/components/home/manifesto/universe-message-reveal.css";

interface UniverseMessageRevealProps {
 open: boolean;
 loading: boolean;
 error?: string | null;
 manifesto: UserManifestoRecord | null;
 onClose: () => void;
}

function hasRevealContent(
 manifesto: UserManifestoRecord | null,
 error: string | null
): boolean {
 if (error) {
 return true;
 }

 const presentation = manifesto?.presentation;
 return Boolean(
 presentation?.cosmicHook?.trim() ||
 presentation?.natalMirror?.trim() ||
 presentation?.manifestoClaim?.trim() ||
 presentation?.ritualWhisper?.trim() ||
 manifesto?.lastMessage?.trim()
 );
}

export default function UniverseMessageReveal({
 open,
 loading,
 error = null,
 manifesto,
 onClose,
}: UniverseMessageRevealProps) {
 const dustMatrix = useMemo(() => createBackdropDustMatrix(96), []);
 const autoFlipReady = !loading && hasRevealContent(manifesto, error);
 const revealKey = `${manifesto?.id ??"pending"}-${loading ?"loading" :"ready"}-${error ??"ok"}`;

 useEffect(() => {
 if (!open) {
 return;
 }

 function handleEscape(event: KeyboardEvent) {
 if (event.key ==="Escape") {
 onClose();
 }
 }

 document.addEventListener("keydown", handleEscape);
 return () => document.removeEventListener("keydown", handleEscape);
 }, [open, onClose]);

 if (typeof document ==="undefined") {
 return null;
 }

 return createPortal(
 <AnimatePresence>
 {open ? (
 <motion.div
 key="universe-overlay"
 className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 sm:p-6"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
 aria-modal="true"
 role="dialog"
 >
 <button
 type="button"
 aria-label="Mesajı kapat"
 className="absolute inset-0 cursor-default"
 onClick={onClose}
 />

 <div className="universe-message-backdrop-dust pointer-events-none z-[1]" aria-hidden>
 {dustMatrix.map((particle) => (
 <span
 key={particle.id}
 className={`universe-message-backdrop-dust-star ${backdropDustClass(particle.tone)}`}
 style={
 {
 left: `${particle.leftPct}%`,
 top: `${particle.topPct}%`,
 width: particle.size,
 height: particle.size,
 animationDelay: `${particle.delay}s`,
 animationDuration: `${particle.duration}s`,"--dust-peak": `${particle.peak}`,"--dust-drift-x": `${particle.driftX}px`,"--dust-drift-y": `${particle.driftY}px`,
 } as CSSProperties
 }
 />
 ))}
 </div>

 <div className="universe-message-modal-card relative z-10 shrink-0">
 <TarotTiltCard
 key={revealKey}
 overlayMode
 autoFlipReady={autoFlipReady}
 >
 <TarotCardFront
 loading={loading}
 error={error}
 manifesto={manifesto}
 />
 </TarotTiltCard>

 <button
 type="button"
 onClick={onClose}
 className="absolute top-3 right-3 z-40 flex h-8 w-8 items-center justify-center rounded-sm border border-zinc-800 bg-[#09090b] text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
 aria-label="Kapat"
 >
 ✕
 </button>
 </div>
 </motion.div>
 ) : null}
 </AnimatePresence>,
 document.body
 );
}
