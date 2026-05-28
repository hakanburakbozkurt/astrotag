export const COSMIC_ENERGY_UPDATED_EVENT = "cosmic-energy-updated";

export function dispatchCosmicEnergyUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COSMIC_ENERGY_UPDATED_EVENT));
}
