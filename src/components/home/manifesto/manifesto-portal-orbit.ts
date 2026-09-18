import type { ManifestoCategoryId, ManifestoTechniqueId } from "@/lib/manifesto/types";

export type OrbitStep = "category" | "technique";

export interface OrbitSatelliteLayout {
 id: string;
 label: string;
 shortLabel: string;
 angleDeg: number;
 radiusPct: number;
}

/** Tek halka — 6 kategori, merkez çember etrafında eşit 60° aralık */
export const CATEGORY_ORBIT: OrbitSatelliteLayout[] = [
 { id:"para", label:"Para & Bolluk", shortLabel:"Para", angleDeg: -90, radiusPct: 47 },
 { id:"is_kariyer", label:"İş & Kariyer", shortLabel:"Kariyer", angleDeg: -30, radiusPct: 47 },
 { id:"ask", label:"Aşk & İlişki", shortLabel:"Aşk", angleDeg: 30, radiusPct: 47 },
 { id:"saglik", label:"Sağlık & Enerji", shortLabel:"Sağlık", angleDeg: 90, radiusPct: 47 },
 { id:"ozguven", label:"Özgüven", shortLabel:"Özgüven", angleDeg: 150, radiusPct: 47 },
 { id:"ruhsal", label:"Ruhsal Büyüme", shortLabel:"Ruhsal", angleDeg: 210, radiusPct: 47 },
];

/** Tek halka — teknik adımı (4 uydu, eşit 90° aralık) */
export const TECHNIQUE_ORBIT: OrbitSatelliteLayout[] = [
 { id:"21_days", label:"21 Gün Kuralı", shortLabel:"21 Gün", angleDeg: -90, radiusPct: 47 },
 { id:"5x55", label:"5×55 Tekniği", shortLabel:"5×55", angleDeg: 0, radiusPct: 47 },
 { id:"3x33", label:"Tesla 3-33 Metodu", shortLabel:"3-33", angleDeg: 90, radiusPct: 47 },
 { id:"369_method", label:"3-6-9 Ritüeli", shortLabel:"3-6-9", angleDeg: 180, radiusPct: 47 },
];

export function orbitPosition(angleDeg: number, radiusPct: number) {
 const rad = (angleDeg * Math.PI) / 180;
 return {
 left: `${50 + Math.cos(rad) * radiusPct}%`,
 top: `${50 + Math.sin(rad) * radiusPct}%`,
 };
}

const BRUTALIST_SATELLITE = {
 border:"border-zinc-700",
 bg:"bg-[#09090b]",
 glow:"",
 text:"text-zinc-300",
} as const;

const SELECTED_SATELLITE = {
 border:"border-zinc-500",
 bg:"bg-zinc-900",
 glow:"",
 text:"text-white",
} as const;

export const CATEGORY_SATELLITE_STYLE: Record<
 ManifestoCategoryId,
 { border: string; bg: string; glow: string; text: string }
> = {
 para: BRUTALIST_SATELLITE,
 is_kariyer: BRUTALIST_SATELLITE,
 ask: BRUTALIST_SATELLITE,
 saglik: BRUTALIST_SATELLITE,
 ozguven: BRUTALIST_SATELLITE,
 ruhsal: BRUTALIST_SATELLITE,
};

export const TECHNIQUE_SATELLITE_STYLE: Record<
 ManifestoTechniqueId,
 { border: string; bg: string; glow: string; text: string }
> = {
  "21_days": BRUTALIST_SATELLITE,
  "5x55": BRUTALIST_SATELLITE,
  "3x33": BRUTALIST_SATELLITE,
  "369_method": BRUTALIST_SATELLITE,
};

export { SELECTED_SATELLITE };
