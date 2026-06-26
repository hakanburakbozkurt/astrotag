export const ORACLE_COSMIC_DATA_ERROR =
  "Kozmik veri akışı şu an doğrulanamıyor. Lütfen kısa süre sonra tekrar deneyin.";

export type OracleModuleId =
  | "natal-chart"
  | "tarot"
  | "horary"
  | "nexus"
  | "cosmic-profile"
  | "cosmic-radar";

export function logOracleModuleError(
  module: OracleModuleId,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const payload =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack, ...context }
      : { error, ...context };

  console.error(`[oracle:${module}]`, payload);
}

export function toOracleUserMessage(error: unknown, fallback = ORACLE_COSMIC_DATA_ERROR): string {
  if (error instanceof Error && error.message.includes("Doğum bilgileri")) {
    return error.message;
  }

  return fallback;
}
