"use client";

import useSWR, { type Key, type SWRConfiguration } from "swr";
import { SWR_DEFAULT_OPTIONS } from "@/lib/auth/data-cache";

export type UseQueryResult<Data, Error = unknown> = {
  data: Data | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  /** İlk yükleme veya hata sonrası yeniden deneme */
  isPending: boolean;
  isRetrying: boolean;
  showError: boolean;
  mutate: ReturnType<typeof useSWR<Data, Error>>["mutate"];
};

/**
 * SWR sarmalayıcı — global retry + yanıt gelene kadar loading durumu.
 */
export function useQuery<Data = unknown, Error = unknown>(
  key: Key,
  fetcher: ((...args: unknown[]) => Promise<Data>) | null,
  options?: SWRConfiguration<Data, Error>
): UseQueryResult<Data, Error> {
  const swr = useSWR<Data, Error>(key, fetcher, {
    ...SWR_DEFAULT_OPTIONS,
    ...options,
  });

  const isRetrying = Boolean(swr.error && swr.isValidating);
  const isInitialLoading = swr.isLoading && swr.data === undefined;
  const isPending = isInitialLoading || isRetrying;
  const showError = Boolean(swr.error && !swr.isValidating && !isInitialLoading);

  return {
    data: swr.data,
    error: showError ? swr.error : undefined,
    isLoading: swr.isLoading,
    isValidating: swr.isValidating,
    isPending,
    isRetrying,
    showError,
    mutate: swr.mutate,
  };
}
