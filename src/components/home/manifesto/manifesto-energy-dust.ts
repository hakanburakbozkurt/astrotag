export type StreamTone ="white" |"violet" |"indigo" |"pink" |"fuchsia";

export interface StreamParticle {
 id: number;
 size: number;
 delay: number;
 duration: number;
 /** Yükseliş hedefi — konteyner yüksekliğinin % */
 risePct: number;
 /** Yatay yelpaze — konteyner genişliğinin % */
 fanXPct: number;
 peak: number;
 endScale: number;
 tone: StreamTone;
}

const TONES: StreamTone[] = ["white", "white", "white", "white", "white"];

type StreamTier ="hotspot" |"inner" |"mid" |"outer";

const TIER_CONFIG: Record<
 StreamTier,
 { count: number; riseMin: number; riseMax: number; fanScale: number; delayScale: number }
> = {
 hotspot: { count: 58, riseMin: 22, riseMax: 58, fanScale: 0.16, delayScale: 0.55 },
 inner: { count: 68, riseMin: 38, riseMax: 76, fanScale: 0.28, delayScale: 0.95 },
 mid: { count: 64, riseMin: 58, riseMax: 88, fanScale: 0.42, delayScale: 1.45 },
 outer: { count: 52, riseMin: 78, riseMax: 96, fanScale: 0.58, delayScale: 2.1 },
};

function pseudoRandom(seed: number): number {
 const value = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
 return value - Math.floor(value);
}

/** İnce, narin kozmik toz — 1px ile 3.5px arası */
function particleSize(id: number, tier: StreamTier): number {
 const roll = pseudoRandom(id + 201);

 if (tier ==="hotspot") {
 return 1.2 + roll * 1.6;
 }
 if (tier ==="outer") {
 return 1 + roll * 2;
 }
 return 1 + roll * 2.5;
}

function buildStar(id: number, tier: StreamTier, tone: StreamTone): StreamParticle {
 const config = TIER_CONFIG[tier];
 const motion = pseudoRandom(id + 401);
 const timing = pseudoRandom(id + 701);
 const lane = pseudoRandom(id + 17) * 2 - 1;
 const risePct =
 config.riseMin + pseudoRandom(id + 501) * (config.riseMax - config.riseMin);
 const fanXPct = lane * risePct * config.fanScale;

 return {
 id,
 size: particleSize(id, tier),
 delay: timing * config.delayScale,
 duration: 0.85 + motion * 1.85,
 risePct,
 fanXPct,
 peak:
 tone ==="white"
 ? 0.88 + pseudoRandom(id + 601) * 0.12
 : 0.72 + pseudoRandom(id + 601) * 0.24,
 endScale: 0.12 + pseudoRandom(id + 801) * 0.22,
 tone,
 };
}

/** Hotspot merkezinden yukarı yelpaze — yalnızca parçacık yoğunluğu */
export function createPortalDustMatrix(): StreamParticle[] {
 const particles: StreamParticle[] = [];
 let cursor = 0;

 for (let i = 0; i < TIER_CONFIG.hotspot.count; i += 1) {
 particles.push(buildStar(cursor++,"hotspot","white"));
 }
 for (let i = 0; i < TIER_CONFIG.inner.count; i += 1) {
 particles.push(
 buildStar(cursor++,"inner", i % 3 === 0 ?"white" : TONES[i % TONES.length]!)
 );
 }
 for (let i = 0; i < TIER_CONFIG.mid.count; i += 1) {
 particles.push(buildStar(cursor++,"mid", TONES[i % TONES.length]!));
 }
 for (let i = 0; i < TIER_CONFIG.outer.count; i += 1) {
 particles.push(buildStar(cursor++,"outer", TONES[i % TONES.length]!));
 }

 return particles;
}

const MONO_STAR =
  "bg-stone-300 shadow-[0_0_2px_rgba(255,255,255,0.9),0_0_4px_rgba(229,224,216,0.45)]";

export const STREAM_STAR_CLASS: Record<StreamTone, string> = {
  white: MONO_STAR,
  violet: MONO_STAR,
  indigo: MONO_STAR,
  pink: MONO_STAR,
  fuchsia: MONO_STAR,
};
