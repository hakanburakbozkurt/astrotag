const LAST_CLAIMED_KEY = "astrotag:star-last-claimed";

export function readLocalLastClaimed(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(LAST_CLAIMED_KEY);
}

export function writeLocalLastClaimed(iso: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(LAST_CLAIMED_KEY, iso);
}

export function clearLocalLastClaimed(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(LAST_CLAIMED_KEY);
}

export function mergeLastClaimed(
  serverValue: string | null | undefined,
  localValue: string | null
): string | null {
  if (!serverValue && !localValue) {
    return null;
  }

  if (!serverValue) {
    return localValue;
  }

  if (!localValue) {
    return serverValue;
  }

  return new Date(serverValue).getTime() >= new Date(localValue).getTime()
    ? serverValue
    : localValue;
}
