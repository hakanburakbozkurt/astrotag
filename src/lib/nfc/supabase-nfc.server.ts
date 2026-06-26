import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import {
  logNfcErrorAndThrow,
  toError,
  type NfcErrorLogContext,
} from "@/lib/nfc/error-logger";

export function throwIfSupabaseError(
  error: PostgrestError | null,
  context: NfcErrorLogContext,
  operation: string,
  details?: Record<string, unknown>
): void {
  if (!error) {
    return;
  }

  const err = toError(`Supabase ${operation} failed: ${error.message}`, error, {
    code: error.code,
    details: error.details,
    hint: error.hint,
  });

  logNfcErrorAndThrow(context, err, {
    operation,
    supabase: {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    },
    ...details,
  });
}
