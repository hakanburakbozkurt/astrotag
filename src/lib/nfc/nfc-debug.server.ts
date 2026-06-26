import "server-only";

/** Sunucu tarafı NFC akış logları — service role anahtarı asla loglanmaz */
export function logNfcDebug(
  step: string,
  meta?: Record<string, unknown>
): void {
  const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`[NFC_DEBUG] ${step}${suffix}`);
}
