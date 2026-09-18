"use client";

import CelestialSealGraphic from "@/components/home/manifesto/CelestialSealGraphic";

export default function TarotCardBackCover() {
 return (
 <div className="universe-tarot-card-body visible h-full min-h-full w-full bg-[#09090b] opacity-100">
 <div className="universe-tarot-card-content items-center">
 <CelestialSealGraphic className="universe-tarot-card-seal opacity-90" />
 </div>

 <p className="universe-tarot-card-brand shrink-0 text-center text-white/35">
 Dokunarak kehaneti aç
 </p>
 </div>
 );
}
