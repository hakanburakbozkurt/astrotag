/** NFC URL segmentini güvenli şekilde çözümler (çift encode vb.). */
export function normalizeNfcUniqueId(raw: string): string {
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // Ham segment kullan
  }
  return value.trim();
}
