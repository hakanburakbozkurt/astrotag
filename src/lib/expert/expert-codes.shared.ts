/** 8 haneli uzman davet / giriş kodu — yalnızca rakam */
export function normalizeExpertCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

export function isValidExpertCode(code: string): boolean {
  return /^\d{8}$/.test(code);
}

export function formatExpertCodeInput(raw: string): string {
  return normalizeExpertCode(raw);
}

/** Sanal NFC slug — oturum FK için */
export function expertNfcSlugForCode(expertCode: string): string {
  return `ex_${normalizeExpertCode(expertCode)}`;
}
