"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { waitForAppRouterReady } from "@/lib/auth/safe-router-nav.client";
import { clientRedirect } from "@/lib/auth/client-redirect.client";

type AppRouter = ReturnType<typeof useRouter>;

type RouterReadyContextValue = {
  isMounted: boolean;
  isRouterReady: boolean;
  isPending: boolean;
  push: (href: string) => Promise<void>;
  replace: (href: string) => Promise<void>;
};

const RouterReadyContext = createContext<RouterReadyContextValue | null>(null);

async function softNavigate(
  router: AppRouter,
  href: string,
  mode: "push" | "replace"
): Promise<void> {
  await waitForAppRouterReady(200);

  try {
    if (mode === "push") {
      router.push(href);
    } else {
      router.replace(href);
    }
  } catch {
    clientRedirect(href);
  }
}

/**
 * Layout'ta tek bir useRouter() — alt bileşenler context kullanır.
 */
export function RouterReadyProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isRouterReady, setIsRouterReady] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    let cancelled = false;

    void waitForAppRouterReady(250).then(() => {
      if (!cancelled) {
        setIsRouterReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const push = useCallback(
    async (href: string) => {
      if (!isMounted || !isRouterReady) {
        clientRedirect(href);
        return;
      }
      await softNavigate(router, href, "push");
    },
    [isMounted, isRouterReady, router]
  );

  const replace = useCallback(
    async (href: string) => {
      if (!isMounted || !isRouterReady) {
        clientRedirect(href);
        return;
      }
      await softNavigate(router, href, "replace");
    },
    [isMounted, isRouterReady, router]
  );

  const value: RouterReadyContextValue = {
    isMounted,
    isRouterReady,
    isPending: !isMounted || !isRouterReady,
    push,
    replace,
  };

  return (
    <RouterReadyContext.Provider value={value}>
      {children}
    </RouterReadyContext.Provider>
  );
}

export function useAppRouter(): RouterReadyContextValue {
  const ctx = useContext(RouterReadyContext);

  if (!ctx) {
    return {
      isMounted: false,
      isRouterReady: false,
      isPending: true,
      push: async (href) => {
        clientRedirect(href);
      },
      replace: async (href) => {
        clientRedirect(href);
      },
    };
  }

  return ctx;
}
