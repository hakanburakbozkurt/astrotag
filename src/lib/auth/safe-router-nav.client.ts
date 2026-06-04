"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AppRouter = ReturnType<typeof useRouter>;

let routerReadyResolve: (() => void) | null = null;
const routerReadyPromise = new Promise<void>((resolve) => {
  routerReadyResolve = resolve;
});

/**
 * App Router dispatch kuyruğu hazır olana kadar bekler (hydration race önler).
 */
export function waitForAppRouterReady(minDelayMs = 120): Promise<void> {
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
        requestAnimationFrame(() => {
          routerReadyResolve?.();
          resolve();
        });
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tick, { once: true });
    } else {
      tick();
    }
  });
}

function hardNavigate(href: string): void {
  window.location.assign(href);
}

async function runRouterNav(
  router: AppRouter,
  href: string,
  mode: "push" | "replace"
): Promise<void> {
  await routerReadyPromise;
  await waitForAppRouterReady();

  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        startTransition(() => {
          try {
            if (mode === "push") {
              router.push(href);
            } else {
              router.replace(href);
            }
            resolve();
          } catch (cause) {
            reject(cause);
          }
        });
      });
      return;
    } catch (cause) {
      lastError = cause;
      await waitForAppRouterReady(80 * (attempt + 1));
    }
  }

  console.warn("[safeRouterNav] soft nav failed, hard redirect:", lastError);
  hardNavigate(href);
}

export async function safeRouterPush(
  router: AppRouter,
  href: string
): Promise<void> {
  return runRouterNav(router, href, "push");
}

export async function safeRouterReplace(
  router: AppRouter,
  href: string
): Promise<void> {
  return runRouterNav(router, href, "replace");
}

/** Hydration sonrası güvenli router.push / replace */
export function useSafeRouter() {
  const router = useRouter();
  const [isRouterReady, setIsRouterReady] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void waitForAppRouterReady().then(() => {
      if (!cancelled) {
        setIsRouterReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const runSafeNav = useCallback(
    async (href: string, mode: "push" | "replace") => {
      if (!isRouterReady) {
        await waitForAppRouterReady();
      }

      setIsNavigating(true);
      try {
        if (mode === "push") {
          await safeRouterPush(router, href);
        } else {
          await safeRouterReplace(router, href);
        }
      } finally {
        setIsNavigating(false);
      }
    },
    [router, isRouterReady]
  );

  const safePush = useCallback(
    (href: string) => runSafeNav(href, "push"),
    [runSafeNav]
  );

  const safeReplace = useCallback(
    (href: string) => runSafeNav(href, "replace"),
    [runSafeNav]
  );

  return {
    router,
    safePush,
    safeReplace,
    isRouterReady,
    /** Router hazır değil veya yönlendirme sürüyor */
    isPending: !isRouterReady || isNavigating,
    isNavigating,
  };
}

type RedirectWhenReadyOptions = {
  replace?: boolean;
  enabled?: boolean;
};

/**
 * Koşul sağlandığında ve router hazır olduğunda tek seferlik yönlendirme.
 */
export function useRedirectWhenReady(
  href: string,
  shouldRedirect: boolean,
  options?: RedirectWhenReadyOptions
): { isRedirecting: boolean } {
  const { safePush, safeReplace, isRouterReady, isNavigating } = useSafeRouter();
  const redirectedRef = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled || !shouldRedirect || !isRouterReady || redirectedRef.current) {
      return;
    }

    redirectedRef.current = true;
    setIsRedirecting(true);

    const navigate = options?.replace ? safeReplace : safePush;

    void navigate(href).finally(() => {
      setIsRedirecting(false);
    });
  }, [
    enabled,
    shouldRedirect,
    isRouterReady,
    href,
    safePush,
    safeReplace,
    options?.replace,
  ]);

  return {
    isRedirecting: isRedirecting || isNavigating || (shouldRedirect && !isRouterReady),
  };
}
