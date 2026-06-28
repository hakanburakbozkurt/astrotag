const STALE_RELOAD_STORAGE_KEY = "astrotag:stale-action-reload";
const MAX_STALE_RELOADS = 2;
const STALE_RELOAD_WINDOW_MS = 60_000;

interface StaleReloadState {
  count: number;
  at: number;
}

function readStaleReloadState(): StaleReloadState {
  if (typeof window === "undefined") {
    return { count: 0, at: 0 };
  }

  try {
    const raw = sessionStorage.getItem(STALE_RELOAD_STORAGE_KEY);
    if (!raw) {
      return { count: 0, at: 0 };
    }

    const parsed = JSON.parse(raw) as Partial<StaleReloadState>;
    return {
      count: typeof parsed.count === "number" ? parsed.count : 0,
      at: typeof parsed.at === "number" ? parsed.at : 0,
    };
  } catch {
    return { count: 0, at: 0 };
  }
}

export function clearStaleActionReloadAttempts(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(STALE_RELOAD_STORAGE_KEY);
}

export function canAttemptStaleActionReload(): boolean {
  const state = readStaleReloadState();
  const now = Date.now();

  if (now - state.at > STALE_RELOAD_WINDOW_MS) {
    return true;
  }

  return state.count < MAX_STALE_RELOADS;
}

export function markStaleActionReloadAttempt(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const now = Date.now();
  const state = readStaleReloadState();
  const nextState: StaleReloadState =
    now - state.at > STALE_RELOAD_WINDOW_MS
      ? { count: 1, at: now }
      : { count: state.count + 1, at: now };

  if (nextState.count > MAX_STALE_RELOADS) {
    return false;
  }

  sessionStorage.setItem(STALE_RELOAD_STORAGE_KEY, JSON.stringify(nextState));
  return true;
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") {
      return record.message;
    }
    if (typeof record.digest === "string") {
      return record.digest;
    }
  }

  return "";
}

/**
 * Detects stale Server Action / deployment mismatch errors only.
 * Plain "not found" (404 pages, missing resources) is intentionally excluded.
 */
export function isStaleServerActionError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();

  if (!message) {
    return false;
  }

  if (message.includes("failed to find server action")) {
    return true;
  }

  if (message.includes("older or newer deployment")) {
    return true;
  }

  if (message.includes("server action") && message.includes("not found")) {
    return true;
  }

  if (message.includes("could not find server action")) {
    return true;
  }

  return false;
}

export function reloadForStaleServerAction(): void {
  window.location.reload();
}
