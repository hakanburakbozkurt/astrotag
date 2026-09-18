export type NebulaPortalPhase = "idle" | "playing" | "dissolving" | "gone";

/** Meditasyon nebula portal videosu — siyah zemin `mix-blend-screen` ile transparan */
export const MANIFESTO_NEBULA_VIDEO_SRC = "/assets/manifesto/nebula-portal-v2.mp4";

/** Portal içi yıldız tozu ritüel süresi (ms) */
export const MANIFESTO_RITUAL_DURATION_MS = 4000;

/** Stardust çözülme animasyon süresi (saniye) — Framer Motion onAnimationComplete ile */
export const MANIFESTO_DISSOLVE_SECONDS = 0.7;

/** Idle durumda görünen ambient parçacık sayısı */
export const MANIFESTO_IDLE_DUST_COUNT = 40;
