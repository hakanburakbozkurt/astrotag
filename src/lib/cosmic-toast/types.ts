export type CosmicToastVariant =
  | "cosmicSuccess"
  | "tarotReady"
  | "compatibilityNudge"
  | "energyPulse"
  | "welcome";

export interface CosmicToastNames {
  userName?: string | null;
  partnerName?: string | null;
}

export interface CosmicToastOptions {
  duration?: number;
  icon?: string;
}
