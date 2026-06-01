import { LOGIN_PATH } from "@/lib/nfc/constants";

export class SupabaseActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseActionError";
  }
}

export function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    window.location.href = LOGIN_PATH;
  }
}

export type { Session } from "@/types/database";

export function formatCountdown(expiresAt: string | null | undefined): string {
  if (!expiresAt) {
    return "00:00:00";
  }

  const remainingMs = new Date(expiresAt).getTime() - Date.now();

  if (remainingMs <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function isSessionActive(
  session: { expires_at?: string | null } | null
): session is { expires_at: string } {
  if (!session?.expires_at) {
    return false;
  }

  return new Date(session.expires_at).getTime() > Date.now();
}
