/** 8 haneli dijital kod — yalnızca rakam */
export function normalizeDigitalAccessCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

export function isValidDigitalAccessCode(code: string): boolean {
  return /^\d{8}$/.test(code);
}

/** 8 haneli uzman davet / giriş kodu — yalnızca rakam */
export function normalizeExpertAccessCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

export function isValidExpertAccessCode(code: string): boolean {
  return /^\d{8}$/.test(code);
}

export function formatExpertAccessCodeInput(raw: string): string {
  return normalizeExpertAccessCode(raw);
}

/** @deprecated EXP-XXXX-XXXX formatı kaldırıldı — normalizeExpertAccessCode kullanın */
export function normalizeExpertAccessCodeLegacy(raw: string): string {
  return normalizeExpertAccessCode(raw);
}
