"use client";

import { useEffect, useState, type ReactNode } from "react";
import { confirmSmartNfcEntryAction } from "@/lib/actions/nfc-smart-entry";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import {
  getClientLastLoginTimestamp,
  isClientAuthPersistenceValid,
} from "@/lib/nfc/last-login-persist.client";

type NfcSmartEntryGateProps = {
  uniqueId: string;
  children: ReactNode;
};

export default function NfcSmartEntryGate({
  uniqueId,
  children,
}: NfcSmartEntryGateProps) {
  const [allowPinScreen, setAllowPinScreen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!isClientAuthPersistenceValid()) {
        if (!cancelled) {
          setAllowPinScreen(true);
        }
        return;
      }

      const result = await confirmSmartNfcEntryAction(
        uniqueId,
        getClientLastLoginTimestamp()
      );

      if (cancelled) {
        return;
      }

      if (result?.redirectTo) {
        clientRedirect(result.redirectTo);
        return;
      }

      setAllowPinScreen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [uniqueId]);

  if (!allowPinScreen) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#070b14] px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400/20 border-t-amber-400/80" />
          <p className="text-xs tracking-wide text-amber-200/75">
            Kozmik oturum doğrulanıyor...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
