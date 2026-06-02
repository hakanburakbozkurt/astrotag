"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { endNfcSessionAction } from "@/lib/actions/nfc-auth";
import {
  CARD_ENTRY_PREFIX,
  HOME_PATH,
  PRIVATE_MODE_PATH,
  SESSION_BACKGROUND_MS,
  SESSION_INACTIVITY_MS,
} from "@/lib/nfc/constants";

const SKIP_PREFIXES = [
  HOME_PATH,
  CARD_ENTRY_PREFIX,
  PRIVATE_MODE_PATH,
];

function isGuardedPath(pathname: string): boolean {
  if (pathname === HOME_PATH) {
    return false;
  }

  return !SKIP_PREFIXES.some(
    (prefix) => prefix !== HOME_PATH && pathname.startsWith(prefix)
  );
}

/**
 * 10 dk etkileşimsizlik veya 5 dk arka plan → oturumu sonlandır, ana sayfaya yönlendir.
 */
export default function SessionActivityGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const lastActivityRef = useRef(Date.now());
  const hiddenAtRef = useRef<number | null>(null);
  const endingRef = useRef(false);

  const endSession = useCallback(async () => {
    if (endingRef.current) {
      return;
    }

    endingRef.current = true;

    try {
      await endNfcSessionAction();
    } catch {
      // Cookie temizliği başarısız olsa da ana sayfaya dön.
    }

    router.replace(HOME_PATH);
  }, [router]);

  const bumpActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    hiddenAtRef.current = null;
  }, []);

  useEffect(() => {
    if (!isGuardedPath(pathname)) {
      return;
    }

    endingRef.current = false;
    lastActivityRef.current = Date.now();
    hiddenAtRef.current = null;

    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

    for (const event of events) {
      window.addEventListener(event, bumpActivity, { passive: true });
    }

    const inactivityTimer = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }

      if (Date.now() - lastActivityRef.current >= SESSION_INACTIVITY_MS) {
        void endSession();
      }
    }, 30_000);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (hiddenAtRef.current !== null) {
        const awayMs = Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;

        if (awayMs >= SESSION_BACKGROUND_MS) {
          void endSession();
          return;
        }
      }

      bumpActivity();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      for (const event of events) {
        window.removeEventListener(event, bumpActivity);
      }
      window.clearInterval(inactivityTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pathname, bumpActivity, endSession]);

  return null;
}
