"use client";

import { useEffect, useRef, useState } from "react";
import { useAppRouter } from "@/lib/auth/router-ready-context.client";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import { checkNfcAutoLoginAction } from "@/lib/actions/nfc-email-auth";
import { authSignupPathClean } from "@/lib/nfc/auth-paths";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { isPrivateBrowsingMode } from "@/lib/nfc/private-mode";
import {
  AUTH_MSG_CARD_NOT_ACTIVE,
  HOME_PATH,
  NFC_CARD_INACTIVE_MESSAGE,
  PRIVATE_MODE_PATH,
} from "@/lib/nfc/constants";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";

type EntryState = "loading" | "error";

type NfcCardEntryClientProps = {
  uniqueId: string;
};

/** NFC okutma → oturum varsa panele; yoksa kayıt / giriş */
export default function NfcCardEntryClient({ uniqueId }: NfcCardEntryClientProps) {
  const { isMounted } = useAppRouter();
  const { safeReplace } = useSafeRouter();
  const startedRef = useRef(false);

  const [state, setState] = useState<EntryState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uniqueId || startedRef.current || !isMounted) {
      return;
    }

    startedRef.current = true;

    void (async () => {
      try {
        if (await isPrivateBrowsingMode()) {
          await safeReplace(PRIVATE_MODE_PATH);
          return;
        }

        await confirmStorageAccessAction();

        const result = await checkNfcAutoLoginAction(uniqueId, {
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          userAgent: navigator.userAgent,
        });

        if (result.status === "logged_in") {
          navigateAfterNfcAuth(result.redirectTo);
          return;
        }

        if (result.status === "auth_required") {
          await safeReplace(
            authSignupPathClean(
              result.cardInactive ? { msg: AUTH_MSG_CARD_NOT_ACTIVE } : undefined
            )
          );
          return;
        }

        if (result.error === NFC_CARD_INACTIVE_MESSAGE) {
          await safeReplace(
            authSignupPathClean({ msg: AUTH_MSG_CARD_NOT_ACTIVE })
          );
          return;
        }

        setError(result.error);
        setState("error");
      } catch (cause) {
        console.error("[NfcCardEntry] client catch:", cause);
        const detail =
          cause instanceof Error ? cause.message : String(cause);
        setError(
          process.env.NODE_ENV === "development"
            ? `Bağlantı kurulamadı: ${detail}`
            : "Bağlantı kurulamadı. Lütfen tekrar deneyin."
        );
        setState("error");
      }
    })();
  }, [uniqueId, isMounted, safeReplace]);

  if (state === "loading") {
    return (
      <AuthMobileShell title="Hoş geldin" subtitle="Kartınız doğrulanıyor...">
        <div className="h-14 animate-pulse rounded-2xl bg-white/10" />
      </AuthMobileShell>
    );
  }

  if (state === "error") {
    return (
      <AuthMobileShell title="Hata" subtitle={error ?? "Bilinmeyen hata"}>
        <button
          type="button"
          onClick={() => void safeReplace(HOME_PATH)}
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/15 text-xs uppercase tracking-widest text-white/60"
        >
          Ana sayfa
        </button>
      </AuthMobileShell>
    );
  }

  return null;
}
