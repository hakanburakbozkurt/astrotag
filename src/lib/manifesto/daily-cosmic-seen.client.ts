const STORAGE_KEY = "astrotag_manifesto_seen";

export function todayDateKeyLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function getManifestoSeenDate(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(STORAGE_KEY);
}

export function hasSeenManifestoToday(): boolean {
  return getManifestoSeenDate() === todayDateKeyLocal();
}

export function markManifestoSeenToday(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, todayDateKeyLocal());
}
