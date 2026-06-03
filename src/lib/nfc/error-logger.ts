/**
 * NFC hata teşhisi — Edge (middleware) ve Node (API/action) uyumlu.
 * Hassas çerez değerleri maskelenir; isim ve uzunluk loglanır.
 */

export type NfcLogLevel = "error" | "warn" | "info";

export type NfcErrorLogContext = {
  layer: "middleware" | "security-gate" | "api" | "action" | "protected-access" | "api-guard";
  handler: string;
  pathname?: string;
  method?: string;
};

const SENSITIVE_HEADER_KEYS = new Set([
  "authorization",
  "cookie",
  "x-api-key",
  "x-supabase-key",
]);

export function serializeError(error: unknown): Record<string, unknown> {
  if (error === null || error === undefined) {
    return { raw: String(error) };
  }

  if (error instanceof Error) {
    const record: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack ?? "(stack yok)",
    };

    if ("code" in error && error.code !== undefined) {
      record.code = error.code;
    }
    if ("status" in error && error.status !== undefined) {
      record.status = error.status;
    }
    if ("details" in error && error.details !== undefined) {
      record.details = error.details;
    }
    if ("hint" in error && error.hint !== undefined) {
      record.hint = error.hint;
    }
    if (error.cause !== undefined) {
      record.cause = serializeError(error.cause);
    }

    return record;
  }

  if (typeof error === "object") {
    try {
      return { ...(error as Record<string, unknown>), raw: JSON.stringify(error) };
    } catch {
      return { raw: String(error) };
    }
  }

  return { raw: String(error) };
}

export function maskCookieHeader(cookieHeader: string): string {
  return cookieHeader
    .split(";")
    .map((part) => {
      const trimmed = part.trim();
      const eq = trimmed.indexOf("=");
      if (eq === -1) {
        return trimmed;
      }

      const name = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1);

      if (
        name.startsWith("astrotag_") ||
        name.startsWith("sb-") ||
        name.includes("supabase")
      ) {
        return `${name}=[present;len=${value.length}]`;
      }

      return `${name}=[redacted;len=${value.length}]`;
    })
    .join("; ");
}

export function sanitizeRequestHeaders(
  headers: Headers | { get: (name: string) => string | null; forEach?: never }
): Record<string, string> {
  const result: Record<string, string> = {};

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === "cookie") {
        result[key] = maskCookieHeader(value);
      } else if (SENSITIVE_HEADER_KEYS.has(lower)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = value;
      }
    });
    return result;
  }

  return result;
}

export function getCookiePresence(
  cookies: { get: (name: string) => { value?: string } | undefined }
): Record<string, string> {
  const names = [
    "astrotag_nfc_session",
    "astrotag_fingerprint",
    "astrotag_storage_ok",
    "astrotag_pending_nfc",
  ];

  const out: Record<string, string> = {};
  for (const name of names) {
    const value = cookies.get(name)?.value;
    out[name] = value
      ? `present(len=${value.length})`
      : "missing";
  }
  return out;
}

export function logNfcEvent(
  level: NfcLogLevel,
  context: NfcErrorLogContext,
  message: string,
  details?: Record<string, unknown>
): void {
  const tag = `[NFC:${context.layer}:${context.handler}]`;
  const payload = {
    timestamp: new Date().toISOString(),
    ...context,
    message,
    ...details,
  };

  const formatted = `${tag} ${message}\n${JSON.stringify(payload, null, 2)}`;

  if (level === "error") {
    console.error(formatted);
    return;
  }

  if (level === "warn") {
    console.warn(formatted);
    return;
  }

  console.info(formatted);
}

export function logNfcError(
  context: NfcErrorLogContext,
  error: unknown,
  details?: Record<string, unknown>
): void {
  const serialized = serializeError(error);
  const summary =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);

  const tag = `[NFC:${context.layer}:${context.handler}]`;

  logNfcEvent("error", context, summary, {
    error: serialized,
    ...details,
  });

  if (error instanceof Error && error.stack) {
    console.error(`${tag} STACK TRACE:\n${error.stack}`);
  }

  console.error(`${tag} RAW ERROR:`, error);
}

/**
 * Terminale yazar ve hatayı yeniden fırlatır (Next.js dev terminal + overlay).
 */
export function logNfcErrorAndThrow(
  context: NfcErrorLogContext,
  error: unknown,
  details?: Record<string, unknown>
): never {
  logNfcError(context, error, details);

  if (error instanceof Error) {
    throw error;
  }

  throw new Error(
    typeof error === "string" ? error : JSON.stringify(serializeError(error))
  );
}

export function toError(
  message: string,
  cause?: unknown,
  extra?: Record<string, unknown>
): Error {
  const err = new Error(message, cause !== undefined ? { cause } : undefined);
  if (extra) {
    Object.assign(err, extra);
  }
  return err;
}
