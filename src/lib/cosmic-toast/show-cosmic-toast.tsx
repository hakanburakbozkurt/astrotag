"use client";

import hotToast from "react-hot-toast";
import CosmicToastCard from "@/components/ui/CosmicToastCard";
import { buildCosmicToastMessage, COSMIC_TOAST_ICONS } from "./messages";
import type { CosmicToastNames, CosmicToastOptions, CosmicToastVariant } from "./types";

export function showCosmicToast(
  variant: CosmicToastVariant,
  names?: CosmicToastNames,
  options?: CosmicToastOptions
) {
  const message = buildCosmicToastMessage(variant, names);
  const icon = options?.icon ?? COSMIC_TOAST_ICONS[variant];

  return hotToast.custom(
    (toastState) => (
      <CosmicToastCard toastState={toastState} message={message} icon={icon} />
    ),
    { duration: options?.duration ?? 4500 }
  );
}
