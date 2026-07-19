export const QUERY_RETRY_DELAY_MS = 2000;
export const QUERY_RETRY_COUNT = 3;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Sunucu aksiyonları — ardışık denemeler arasında 2 sn bekler */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; delayMs?: number }
): Promise<T> {
  const retries = options?.retries ?? QUERY_RETRY_COUNT;
  const delayMs = options?.delayMs ?? QUERY_RETRY_DELAY_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}
