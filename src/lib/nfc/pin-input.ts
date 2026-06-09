/** PIN giriş normalizasyonu — client ve server ortak kullanım */
export function normalizePinInput(pin: string): string {
  return pin.replace(/\D/g, "").trim();
}

export function isPinInputReady(pin: string): boolean {
  const normalized = normalizePinInput(pin);
  return normalized.length >= 4 && normalized.length <= 8;
}
