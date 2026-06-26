"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { checkAuthPersistenceRedirect } from "@/lib/actions/nfc-auth-persistence";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { HOME_PATH } from "@/lib/nfc/constants";
import { isClientAuthPersistenceValid } from "@/lib/nfc/last-login-persist.client";

export default function NfcAuthPersistenceBootstrap() {
  const pathname = usePathname();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (pathname !== HOME_PATH || checkedRef.current) {
      return;
    }

    checkedRef.current = true;

    void (async () => {
      if (!isClientAuthPersistenceValid()) {
        return;
      }

      const redirectTo = await checkAuthPersistenceRedirect();
      if (redirectTo) {
        clientRedirect(redirectTo);
      }
    })();
  }, [pathname]);

  return null;
}
