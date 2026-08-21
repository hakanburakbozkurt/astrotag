/** Aktif yasal metin sürümleri — sözleşme güncellenince burada ve migration'da senkron tutulur */

export const LEGAL_VERSION = "v1.0" as const;

export const CONSENT_TYPES = [
  "tos",
  "privacy",
  "distance_selling",
  "cayma_hakki",
  "instant_digital_fulfillment",
  "promo_crystal_terms",
  "gift_policy",
] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

export type ConsentRequirement = {
  consentType: ConsentType;
  version: string;
};

/** Kayıt (signup) sırasında zorunlu onaylar */
export const SIGNUP_REQUIRED_CONSENTS: ConsentRequirement[] = [
  { consentType: "tos", version: LEGAL_VERSION },
  { consentType: "privacy", version: LEGAL_VERSION },
];

/** Kristal checkout sırasında zorunlu onaylar */
export const CHECKOUT_REQUIRED_CONSENTS: ConsentRequirement[] = [
  { consentType: "distance_selling", version: LEGAL_VERSION },
  { consentType: "cayma_hakki", version: LEGAL_VERSION },
  { consentType: "instant_digital_fulfillment", version: LEGAL_VERSION },
];

export function consentRequirementsToJson(
  requirements: ConsentRequirement[]
): Array<{ consent_type: string; version: string }> {
  return requirements.map((item) => ({
    consent_type: item.consentType,
    version: item.version,
  }));
}
