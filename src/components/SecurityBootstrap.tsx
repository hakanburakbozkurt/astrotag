"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import {
  CARD_ENTRY_PREFIX,
  HOME_PATH,
  NFC_LOGIN_PATH,
  PROFILE_SETUP_PATH,
  REGISTRATION_COMPLETE_PATH,
  PRIVATE_MODE_PATH,
  PUBLIC_PROFILE_PREFIX,
  AUTH_CALLBACK_PATH,
} from "@/lib/nfc/constants";
import { SALES_ONLY_PATHS } from "@/lib/sales/star-packages-catalog";
import { isAuthFormPath } from "@/lib/nfc/auth-paths";
import { isRootCardEntryPath } from "@/lib/nfc/card-paths";
import { isPrivateBrowsingMode } from "@/lib/nfc/private-mode";

function shouldRunStorageCheck(pathname: string): boolean {
  if (SALES_ONLY_PATHS.has(pathname)) {
    return false;
  }

  if (pathname.startsWith(PRIVATE_MODE_PATH)) {
    return false;
  }

  if (pathname === PROFILE_SETUP_PATH) {
    return false;
  }

  if (pathname === REGISTRATION_COMPLETE_PATH) {
    return false;
  }

  if (
    pathname.startsWith(CARD_ENTRY_PREFIX) ||
    pathname.startsWith(PUBLIC_PROFILE_PREFIX) ||
    pathname === NFC_LOGIN_PATH ||
    isRootCardEntryPath(pathname) ||
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
