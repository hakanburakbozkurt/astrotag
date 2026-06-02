export function cardEntryPathForUniqueId(uniqueId: string): string {
  return `/c/${encodeURIComponent(uniqueId.trim())}`;
}
