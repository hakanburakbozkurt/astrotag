export interface BackdropDustParticle {
 id: number;
 leftPct: number;
 topPct: number;
 size: number;
 delay: number;
 duration: number;
 peak: number;
 driftX: number;
 driftY: number;
 tone: "white" | "gold" |"violet";
}

function pseudoRandom(seed: number): number {
 const value = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
 return value - Math.floor(value);
}

const TONE_CLASS: Record<BackdropDustParticle["tone"], string> = {
 white:"bg-white shadow-[0_0_2px_rgba(255,255,255,0.95),0_0_5px_rgba(255,255,255,0.45)]",
 gold:"bg-zinc-900 shadow-[0_0_2px_rgba(245,230,200,0.95),0_0_6px_rgba(212,175,55,0.45)]",
 violet:"bg-zinc-900 shadow-[0_0_2px_rgba(221,214,254,0.9),0_0_5px_rgba(167,139,250,0.35)]",
};

/** Modal perdesi üzerinde süzülen ince kozmik toz */
export function createBackdropDustMatrix(count = 96): BackdropDustParticle[] {
 const tones: BackdropDustParticle["tone"][] = ["white","gold","violet"];

 return Array.from({ length: count }, (_, id) => {
 const tone = tones[id % tones.length]!;
 return {
 id,
 leftPct: pseudoRandom(id + 11) * 100,
 topPct: pseudoRandom(id + 29) * 100,
 size: 1 + pseudoRandom(id + 47) * 2.5,
 delay: pseudoRandom(id + 83) * 10,
 duration: 14 + pseudoRandom(id + 101) * 16,
 peak: 0.35 + pseudoRandom(id + 137) * 0.55,
 driftX: (pseudoRandom(id + 173) - 0.5) * 28,
 driftY: -18 - pseudoRandom(id + 211) * 32,
 tone,
 };
 });
}

export function backdropDustClass(tone: BackdropDustParticle["tone"]): string {
 return TONE_CLASS[tone];
}
