"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AppRouter = ReturnType<typeof useRouter>;

/**
 * App Router dispatch kuyruğu hazır olana kadar bekler (hydration race önler).
 */
export function waitForAppRouterReady(minDelayMs = 50): Promise<void> {
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

async function runRouterNav(
  router: AppRouter,
  href: string,
  mode: "push" | "replace"
): Promise<void> {
  await waitForAppRouterReady();

  await new Promise<void>((resolve) => {
    startTransition(() => {
      try {
        if (mode === "push") {
          router.push(href);
        } else {
          router.replace(href);
        }
      } catch (cause) {
        console.warn("[safeRouterNav] soft nav failed, hard redirect:", cause);
        window.location.assign(href);
      }
      resolve();
    });
  });
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

  const safePush = useCallback(
    (href: string) => safeRouterPush(router, href),
    [router]
  );

  const safeReplace = useCallback(
    (href: string) => safeRouterReplace(router, href),
    [router]
  );

  return { router, safePush, safeReplace, isRouterReady };
}
