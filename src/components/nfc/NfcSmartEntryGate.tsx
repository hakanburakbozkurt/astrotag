"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const persistenceValid = isClientAuthPersistenceValid();
      const clientLastLoginMs = getClientLastLoginTimestamp();

      console.log("[NFC_SMART_ENTRY/client]", {
        uniqueId,
        persistenceValid,
        clientLastLoginMs,
        module: searchParams.get("module"),
        to: searchParams.get("to"),
      });

      if (!persistenceValid) {
        console.log("[NFC_SMART_ENTRY/client] persistence geçersiz — PIN ekranı");
        if (!cancelled) {
          setAllowPinScreen(true);
        }
        return;
      }

      const query: Record<string, string> = {};
      const module = searchParams.get("module");
      const to = searchParams.get("to");
      if (module) query.module = module;
      if (to) query.to = to;

      const result = await confirmSmartNfcEntryAction(
        uniqueId,
        clientLastLoginMs,
        Object.keys(query).length > 0 ? query : undefined
      );

      if (cancelled) {
        return;
      }

      if (result?.redirectTo) {
        console.log("[NFC_SMART_ENTRY/client] redirect →", result.redirectTo);
        clientRedirect(result.redirectTo);
        return;
      }

      console.log("[NFC_SMART_ENTRY/client] smart entry başarısız — PIN ekranı");
      setAllowPinScreen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [uniqueId, searchParams]);

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
