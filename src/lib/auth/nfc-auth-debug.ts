/**
 * NFC e-posta kayıt / OTP debug — terminal (server action) + tarayıcı (client import).
 */

export type SupabaseAuthErrorPayload = {
  message?: string;
  code?: string | number;
  status?: string | number;
  details?: unknown;
  hint?: unknown;
  name?: string;
  [key: string]: unknown;
};

export function serializeSupabaseAuthError(error: unknown): SupabaseAuthErrorPayload {
  if (error === null || error === undefined) {
    return { message: String(error) };
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    return {
      message:
        typeof record.message === "string"
          ? record.message
          : String(record.message ?? error),
      code: record.code as string | number | undefined,
      status: record.status as string | number | undefined,
      details: record.details,
      hint: record.hint,
      name: typeof record.name === "string" ? record.name : undefined,
    };
  }

  return { message: String(error) };
}

export function authErrorMessage(error: unknown, fallback: string): string {
  const payload = serializeSupabaseAuthError(error);
  const message = payload.message?.trim();
  return message || fallback;
}

/** İz sürme — fonksiyon girişi / dal atlama */
export function logNfcAuthTrace(
  step: string,
  meta?: Record<string, unknown>
): void {
  const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`NFC_AUTH: ${step}${suffix}`);
}

/** Supabase auth hatası — terminal + tarayıcı (client'tan çağrılırsa) */
export function logNfcAuthSupabaseError(
  step: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const payload = serializeSupabaseAuthError(error);

  console.error(`NFC_AUTH: Hata yakalandı — ${step}`);
  console.error(JSON.stringify(payload, null, 2));

  if (context && Object.keys(context).length > 0) {
    console.error(
      `NFC_AUTH: context — ${step}`,
      JSON.stringify(context, null, 2)
    );
  }
}
