"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import {
  CARD_ENTRY_PREFIX,
  HOME_PATH,
  PRIVATE_MODE_PATH,
  PUBLIC_PROFILE_PREFIX,
  VERIFY_OTP_PATH,
  AUTH_CALLBACK_PATH,
} from "@/lib/nfc/constants";
import { isPrivateBrowsingMode } from "@/lib/nfc/private-mode";

function shouldRunStorageCheck(pathname: string): boolean {
  if (pathname === HOME_PATH) {
    return false;
  }

  if (pathname.startsWith(PRIVATE_MODE_PATH)) {
    return false;
  }

  if (
    pathname.startsWith(CARD_ENTRY_PREFIX) ||
    pathname.startsWith(PUBLIC_PROFILE_PREFIX) ||
    pathname === VERIFY_OTP_PATH ||
    pathname.startsWith(AUTH_CALLBACK_PATH)
  ) {
    return false;
  }

  return true;
}

export default function SecurityBootstrap() {
  const { safeReplace, isRouterReady } = useSafeRouter();
  const pathname = usePathname();
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldRunStorageCheck(pathname) || !isRouterReady) {
      return;
    }

    if (checkedRef.current === pathname) {
      return;
    }

    checkedRef.current = pathname;

    void (async () => {
      if (await isPrivateBrowsingMode()) {
        await safeReplace(PRIVATE_MODE_PATH);
        return;
      }

      await confirmStorageAccessAction();
    })();
  }, [pathname, isRouterReady, safeReplace]);

  return null;
}
