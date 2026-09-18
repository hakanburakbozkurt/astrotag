export interface StardustParticle {
 id: number;
 originX: number;
 originY: number;
 driftX: number;
 driftY: number;
 size: number;
 delay: number;
 duration: number;
 hue: "violet" | "cyan" |"amber" |"pink";
}

const HUE_CLASS: Record<StardustParticle["hue"], string> = {
 violet:"bg-zinc-900 shadow-[0_0_8px_rgba(167,139,250,0.9)]",
 cyan:"bg-zinc-900 shadow-[0_0_8px_rgba(34,211,238,0.85)]",
 amber:"bg-zinc-900 shadow-[0_0_8px_rgba(255,255,255,0.08)]",
 pink:"bg-zinc-900 shadow-[0_0_8px_rgba(244,114,182,0.85)]",
};

export function getStardustParticleClass(hue: StardustParticle["hue"]): string {
 return HUE_CLASS[hue];
}

export function createStardustParticles(count = 52): StardustParticle[] {
 const hues: StardustParticle["hue"][] = ["violet","cyan","amber","pink"];

 return Array.from({ length: count }, (_, id) => {
 const angle = Math.random() * Math.PI * 2;
 const radius = Math.random() * 42;

 return {
 id,
 originX: Math.cos(angle) * radius * 0.55,
 originY: Math.sin(angle) * radius * 0.65,
 driftX: (Math.random() - 0.5) * 120,
 driftY: -(80 + Math.random() * 180),
 size: 2 + Math.random() * 4.5,
 delay: Math.random() * 0.22,
 duration: 0.85 + Math.random() * 0.75,
 hue: hues[id % hues.length]!,
 };
 });
}

/** Parçacık + portal animasyonu toplam süresi (ms) */
export const MANIFESTO_DISSOLVE_MS = 1600;
