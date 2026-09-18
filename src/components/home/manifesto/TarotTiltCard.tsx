"use client";

import {
 useCallback,
 useEffect,
 useRef,
 useState,
 type CSSProperties,
 type ReactNode,
} from"react";
import {
 motion,
 useMotionTemplate,
 useMotionValue,
 useSpring,
 useTransform,
} from"framer-motion";
import TarotCardBackCover from "@/components/home/manifesto/TarotCardBackCover";
import TarotMysticFrame from "@/components/home/manifesto/TarotMysticFrame";

interface TarotTiltCardProps {
 children: ReactNode;
 className?: string;
 /** Ritüel bitti + mesaj hazır olduğunda otomatik flip */
 autoFlipReady?: boolean;
 /** Sonuç overlay — ön yüz içeriği flip sonrası görünür kalsın */
 overlayMode?: boolean;
 onClose?: () => void;
}

export default function TarotTiltCard({
 children,
 className ="",
 autoFlipReady = false,
 overlayMode = false,
 onClose,
}: TarotTiltCardProps) {
 const cardRef = useRef<HTMLDivElement>(null);
 const [revealed, setRevealed] = useState(overlayMode);
 const [tilted, setTilted] = useState(false);
 const autoFlipTriggeredRef = useRef(false);

 const pointerX = useMotionValue(0.5);
 const pointerY = useMotionValue(0.5);

 const springConfig = { stiffness: 260, damping: 22, mass: 0.55 };
 const tiltX = useSpring(useTransform(pointerY, [0, 1], [10, -10]), springConfig);
 const tiltY = useSpring(useTransform(pointerX, [0, 1], [-10, 10]), springConfig);

 const sheenX = useTransform(pointerX, [0, 1], ["18%","82%"]);
 const sheenY = useTransform(pointerY, [0, 1], ["22%","78%"]);
 const sheenBackground = useMotionTemplate`radial-gradient(circle at ${sheenX} ${sheenY}, rgba(245,230,200,0.28) 0%, rgba(212,175,55,0.12) 22%, transparent 52%)`;

 const reveal = useCallback(() => {
 setRevealed(true);
 }, []);

 useEffect(() => {
 if (overlayMode) {
 return;
 }

 if (!autoFlipReady || autoFlipTriggeredRef.current) {
 return;
 }

 autoFlipTriggeredRef.current = true;
 const timer = window.setTimeout(reveal, 700);
 return () => window.clearTimeout(timer);
 }, [autoFlipReady, overlayMode, reveal]);

 const resetTilt = useCallback(() => {
 pointerX.set(0.5);
 pointerY.set(0.5);
 setTilted(false);
 }, [pointerX, pointerY]);

 const applyPointer = useCallback(
 (clientX: number, clientY: number) => {
 const rect = cardRef.current?.getBoundingClientRect();
 if (!rect) {
 return;
 }

 pointerX.set((clientX - rect.left) / rect.width);
 pointerY.set((clientY - rect.top) / rect.height);
 setTilted(true);
 },
 [pointerX, pointerY]
 );

 const handlePointerMove = useCallback(
 (clientX: number, clientY: number) => {
 if (overlayMode) {
 return;
 }
 applyPointer(clientX, clientY);
 },
 [applyPointer, overlayMode]
 );

 if (overlayMode) {
 return (
 <div className="universe-tarot-card-scene relative h-full w-full shrink-0">
 <article
 role="dialog"
 className={`universe-tarot-card-face universe-tarot-card-face--overlay universe-tarot-frame-outer relative h-full w-full overflow-hidden ${className}`}
 >
 <div className="universe-tarot-card-chrome" aria-hidden>
 <TarotMysticFrame />
 </div>
 <div className="universe-tarot-card-front-layer">{children}</div>
 </article>
 </div>
 );
 }

 return (
 <div className="universe-tarot-card-scene relative h-full w-full shrink-0">
 <motion.div
 className="universe-tarot-card-flipper"
 initial={{
 rotateY: 180,
 opacity: 0,
 y: 36,
 scale: 0.88,
 }}
 animate={{
 rotateY: revealed ? 0 : 180,
 opacity: 1,
 y: 0,
 scale: 1,
 }}
 exit={{ rotateY: 24, opacity: 0, y: 18, scale: 0.94 }}
 transition={{
 rotateY: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
 opacity: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
 y: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
 scale: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
 }}
 style={{ transformStyle:"preserve-3d" } as CSSProperties}
 >
 <motion.div
 ref={cardRef}
 className={`universe-tarot-card-inner relative ${tilted ?"universe-tarot-card-inner--tilted" :""}`}
 style={{
 rotateX: tiltX,
 rotateY: tiltY,
 transformStyle:"preserve-3d",
 } as CSSProperties}
 onMouseMove={(event) => handlePointerMove(event.clientX, event.clientY)}
 onMouseLeave={resetTilt}
 onTouchStart={(event) => {
 const touch = event.touches[0];
 if (touch) {
 handlePointerMove(touch.clientX, touch.clientY);
 }
 }}
 onTouchMove={(event) => {
 const touch = event.touches[0];
 if (touch) {
 handlePointerMove(touch.clientX, touch.clientY);
 }
 }}
 onTouchEnd={resetTilt}
 >
 {/* Arka yüz — kapalı / gizemli hali */}
 <div
 className={`universe-tarot-card-back universe-tarot-frame-outer absolute inset-0 overflow-hidden ${className}`}
 >
 <div className="universe-tarot-card-chrome" aria-hidden>
 <TarotMysticFrame />
 <motion.div
 className="universe-tarot-card-sheen"
 style={{ background: sheenBackground }}
 />
 </div>
 <div className="universe-tarot-card-front-layer">
 <TarotCardBackCover />
 </div>

 {!revealed ? (
 <button
 type="button"
 className="absolute inset-0 z-20 cursor-pointer bg-transparent"
 onClick={(event) => {
 event.stopPropagation();
 reveal();
 }}
 aria-label="Kehaneti aç"
 />
 ) : null}
 </div>

 {/* Ön yüz — mesaj */}
 <article
 role="dialog"
 className={`universe-tarot-card-face universe-tarot-frame-outer absolute inset-0 overflow-hidden ${
 revealed || overlayMode ?"universe-tarot-card-face--revealed" :""
 } ${className}`}
 >
 <div className="universe-tarot-card-chrome" aria-hidden>
 <TarotMysticFrame />
 {!overlayMode ? (
 <motion.div
 className="universe-tarot-card-sheen"
 style={{ background: sheenBackground }}
 />
 ) : null}
 </div>
 <div className="universe-tarot-card-front-layer">{children}</div>
 </article>
 </motion.div>
 </motion.div>

 {onClose && !overlayMode ? (
 <button
 type="button"
 onClick={onClose}
 className="absolute top-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-sm border border-zinc-800 bg-[#09090b] text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
 aria-label="Kapat"
 >
 ✕
 </button>
 ) : null}
 </div>
 );
}
