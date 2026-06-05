"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import {
  CARD_ENTRY_PREFIX,
  HOME_PATH,
  PRIVATE_MODE_PATH,
  PUBLIC_PROFILE_PREFIX,
  AUTH_CALLBACK_PATH,
} from "@/lib/nfc/constants";
import { isAuthFormPath } from "@/lib/nfc/auth-paths";
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
    isAuthFormPath(pathname) ||
    pathname.startsWith(AUTH_CALLBACK_PATH)
  ) {
    return false;
  }

  return true;
}

export default function SecurityBootstrap() {
  const pathname = usePathname();
  const checkedRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current || !shouldRunStorageCheck(pathname)) {
      return;
    }

    if (checkedRef.current === pathname) {
      return;
    }

    checkedRef.current = pathname;

    void (async () => {
      if (await isPrivateBrowsingMode()) {
        clientRedirect(PRIVATE_MODE_PATH);
        return;
      }

      await confirmStorageAccessAction();
    })();
  }, [pathname]);

  return null;
}
