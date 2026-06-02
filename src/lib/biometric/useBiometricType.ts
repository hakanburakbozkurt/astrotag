"use client";

import { useMemo } from "react";
import type { BiometricPresentation } from "@/lib/biometric/biometric-labels";
import { detectBiometricPresentation } from "@/lib/biometric/biometric-type.client";

/**
 * İstemci bileşenlerinde biyometrik etiketler (Face ID / Touch ID / genel).
 */
export function useBiometricType(): BiometricPresentation {
  return useMemo(() => detectBiometricPresentation(), []);
}
