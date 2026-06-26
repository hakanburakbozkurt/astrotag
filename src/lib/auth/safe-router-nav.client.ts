"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { useAppRouter } from "@/lib/auth/router-ready-context.client";

/**
 * App Router dispatch kuyruğu hazır olana kadar bekler (hydration race önler).
 */
export function waitForAppRouterReady(minDelayMs = 200): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      if (elapsed < minDelayMs) {
        requestAnimationFrame(tick);
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tick, { once: true });
    } else {
      tick();
    }
  });
}

/**
 * Otomatik yönlendirme (useEffect / guard) — asla router.push kullanmaz.
 */
export function redirectWhenReady(href: string): void {
  void waitForAppRouterReady().then(() => {
    clientRedirect(href);
  });
}

/** @deprecated navigateAfterNfcAuth ile aynı — tam sayfa geçişi */
export async function safeRouterPush(
  _router: unknown,
  href: string
): Promise<void> {
  clientRedirect(href);
}

export async function safeRouterReplace(
  _router: unknown,
  href: string
): Promise<void> {
  clientRedirect(href);
}

/**
 * Context üzerinden güvenli navigasyon (useRouter burada çağrılmaz).
 */
export function useSafeRouter() {
  const { push, replace, isMounted, isRouterReady, isPending } = useAppRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const runNav = useCallback(
    async (href: string, mode: "push" | "replace") => {
      setIsNavigating(true);
      try {
        if (mode === "push") {
          await push(href);
        } else {
          await replace(href);
        }
      } finally {
        setIsNavigating(false);
      }
    },
    [push, replace]
  );

  const safePush = useCallback((href: string) => runNav(href, "push"), [runNav]);
  const safeReplace = useCallback(
    (href: string) => runNav(href, "replace"),
    [runNav]
  );

  return {
    router: null,
    safePush,
    safeReplace,
    isMounted,
    isRouterReady,
    isPending: isPending || isNavigating,
    isNavigating,
  };
}

type RedirectWhenReadyOptions = {
  replace?: boolean;
  enabled?: boolean;
};

/**
 * İlk yüklemede tek seferlik tam sayfa yönlendirme (router.push yok).
 */
export function useRedirectWhenReady(
  href: string,
  shouldRedirect: boolean,
  options?: RedirectWhenReadyOptions
): { isRedirecting: boolean } {
  const redirectedRef = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled || !shouldRedirect || redirectedRef.current) {
      return;
    }

    redirectedRef.current = true;
    setIsRedirecting(true);
    redirectWhenReady(href);
  }, [enabled, shouldRedirect, href]);

  return { isRedirecting };
}
