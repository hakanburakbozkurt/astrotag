/** 8 haneli dijital kod — yalnızca rakam */
export function normalizeDigitalAccessCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

/** EXP-XXXX-XXXX formatı */
export function normalizeExpertAccessCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = cleaned.startsWith("EXP") ? cleaned.slice(3) : cleaned;
  const segmentA = body.slice(0, 4);
  const segmentB = body.slice(4, 8);
  return `EXP-${segmentA}${segmentB.length ? `-${segmentB}` : ""}`;
}

export function isValidDigitalAccessCode(code: string): boolean {
  return /^\d{8}$/.test(code);
}

export function isValidExpertAccessCode(code: string): boolean {
  return /^EXP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
}

export function formatExpertAccessCodeInput(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = cleaned.startsWith("EXP") ? cleaned.slice(3) : cleaned;
  const a = body.slice(0, 4);
  const b = body.slice(4, 8);
  if (!a && !b) {
    return "";
  }
  if (!b) {
    return `EXP-${a}`;
  }
  return `EXP-${a}-${b}`;
}
