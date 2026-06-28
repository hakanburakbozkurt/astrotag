const SEEN_NOTIFICATIONS_KEY = "astrotag:seen_notifications";
const MAX_SEEN_NOTIFICATIONS = 48;

function readSeenIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(SEEN_NOTIFICATIONS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function writeSeenIds(ids: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify(ids.slice(-MAX_SEEN_NOTIFICATIONS)));
}

export function isNotificationSeen(id: string): boolean {
  return readSeenIds().includes(id);
}

export function markNotificationSeen(id: string): void {
  const next = readSeenIds().filter((seenId) => seenId !== id);
  next.push(id);
  writeSeenIds(next);
}

export function pickRandomUnseen<T extends { id: string }>(items: T[]): T | null {
  if (items.length === 0) {
    return null;
  }

  const unseen = items.filter((item) => !isNotificationSeen(item.id));
  const pool = unseen.length > 0 ? unseen : items;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? null;
}
