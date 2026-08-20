"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import {
  CARD_ENTRY_PREFIX,
  NFC_ENTER_PATH,
  NFC_LOGIN_PATH,
  PRIVATE_MODE_PATH,
  PUBLIC_PROFILE_PREFIX,
  AUTH_CALLBACK_PATH,
  AUTH_FORGOT_PASSWORD_PATH,
  AUTH_RESET_PASSWORD_PATH,
  EXPERT_AUTH_CALLBACK_PATH,
} from "@/lib/nfc/constants";
import { isRootCardEntryPath } from "@/lib/nfc/card-paths";
import { isPrivateBrowsingMode } from "@/lib/nfc/private-mode";

/** Gizli sekme / depolama kontrolü yalnızca fiziksel NFC kart rotalarında */
function shouldRunNfcStorageCheck(pathname: string): boolean {
  if (pathname.startsWith(PRIVATE_MODE_PATH)) {
    return false;
  }

  if (
    pathname === NFC_LOGIN_PATH ||
    pathname === NFC_ENTER_PATH ||
    pathname.startsWith(`${NFC_ENTER_PATH}/`) ||
    pathname.startsWith(CARD_ENTRY_PREFIX) ||
    pathname.startsWith(PUBLIC_PROFILE_PREFIX) ||
    isRootCardEntryPath(pathname) ||
    pathname.toLowerCase().startsWith("/at_")
  ) {
    return true;
  }

  return false;
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
    if (!mountedRef.current || !shouldRunNfcStorageCheck(pathname)) {
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
