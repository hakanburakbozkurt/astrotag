"use client";

import { showCosmicToast } from "./show-cosmic-toast";
import type { CosmicToastNames, CosmicToastOptions, CosmicToastVariant } from "./types";

function invoke(
  variant: CosmicToastVariant,
  userName?: string | null,
  partnerName?: string | null,
  options?: CosmicToastOptions
) {
  const names: CosmicToastNames = { userName, partnerName };
  return showCosmicToast(variant, names, options);
}

export function createCosmicToastApi() {
  return {
    cosmic(
      userName?: string | null,
      partnerName?: string | null,
      variant: CosmicToastVariant = "cosmicSuccess",
      options?: CosmicToastOptions
    ) {
      return invoke(variant, userName, partnerName, options);
    },

    cosmicSuccess(userName?: string | null, partnerName?: string | null, options?: CosmicToastOptions) {
      return invoke("cosmicSuccess", userName, partnerName, options);
    },

    tarotReady(userName?: string | null, partnerName?: string | null, options?: CosmicToastOptions) {
      return invoke("tarotReady", userName, partnerName, options);
    },

    compatibilityNudge(
      userName?: string | null,
      partnerName?: string | null,
      options?: CosmicToastOptions
    ) {
      return invoke("compatibilityNudge", userName, partnerName, options);
    },

    energyPulse(userName?: string | null, partnerName?: string | null, options?: CosmicToastOptions) {
      return invoke("energyPulse", userName, partnerName, options);
    },

    welcome(userName?: string | null, partnerName?: string | null, options?: CosmicToastOptions) {
      return invoke("welcome", userName, partnerName, options);
    },
  };
}

export type CosmicToastApi = ReturnType<typeof createCosmicToastApi>;
