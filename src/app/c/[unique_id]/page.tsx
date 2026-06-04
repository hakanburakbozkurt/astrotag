"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import NfcLoginForm from "@/components/nfc/NfcLoginForm";
import { checkNfcAutoLoginAction } from "@/lib/actions/nfc-email-auth";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { isPrivateBrowsingMode } from "@/lib/nfc/private-mode";
import { HOME_PATH, PRIVATE_MODE_PATH } from "@/lib/nfc/constants";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";

type EntryState = "loading" | "login" | "error";

/** NFC okutma → oturum varsa panele; yoksa e-posta + şifre girişi */
export default function NfcCardEntryPage() {
  const router = useRouter();
  const params = useParams<{ unique_id: string }>();
  const uniqueId = params.unique_id
    ? normalizeNfcUniqueId(params.unique_id)
    : undefined;
  const startedRef = useRef(false);

  const [state, setState] = useState<EntryState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uniqueId || startedRef.current) {
      return;
    }

    startedRef.current = true;

    void (async () => {
      try {
        if (await isPrivateBrowsingMode()) {
          router.replace(PRIVATE_MODE_PATH);
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
          setState("login");
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
  }, [uniqueId, router]);

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
          onClick={() => router.replace(HOME_PATH)}
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/15 text-xs uppercase tracking-widest text-white/60"
        >
          Ana sayfa
        </button>
      </AuthMobileShell>
    );
  }

  return (
    <AuthMobileShell
      title="AstroTag'a Gir"
      subtitle="Kozmik profilinize erişmek için hesabınızla giriş yapın veya kaydolun."
    >
      {uniqueId ? <NfcLoginForm uniqueId={uniqueId} /> : null}
    </AuthMobileShell>
  );
}
