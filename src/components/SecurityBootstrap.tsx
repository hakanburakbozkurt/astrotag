"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import {
  CARD_ENTRY_PREFIX,
  HOME_PATH,
  PRIVATE_MODE_PATH,
  PUBLIC_PROFILE_PREFIX,
  VERIFY_OTP_PATH,
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
    pathname === VERIFY_OTP_PATH
  ) {
    return false;
  }

  return true;
}

export default function SecurityBootstrap() {
  const router = useRouter();
  const pathname = usePathname();
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!shouldRunStorageCheck(pathname)) {
      return;
    }

    if (checkedRef.current === pathname) {
      return;
    }

    checkedRef.current = pathname;

    void (async () => {
      if (await isPrivateBrowsingMode()) {
        router.replace(PRIVATE_MODE_PATH);
        return;
      }

      await confirmStorageAccessAction();
    })();
  }, [pathname, router]);

  return null;
}
