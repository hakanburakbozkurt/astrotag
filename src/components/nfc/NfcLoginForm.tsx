"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import { authQueryMessageText } from "@/lib/auth/auth-query-messages";
import { logNfcAuthTrace } from "@/lib/auth/nfc-auth-debug";
import {
  getPendingNfcIdAction,
  rememberPendingNfcForAuthAction,
  startNfcLoginAction,
} from "@/lib/actions/nfc-email-auth";
import { authLoginPathClean, nfcAuthSignupPath } from "@/lib/nfc/auth-paths";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";
import { useNfcAuthQuery } from "@/components/nfc/use-nfc-auth-query";

type AuthToast = {
  message: string;
  variant: "error" | "info";
};

export default function NfcLoginForm() {
  const searchParams = useSearchParams();
  const { uniqueId: uniqueIdFromQuery, email: emailFromQuery, msg: msgFromQuery } =
    useNfcAuthQuery();
  const { safePush, safeReplace, isRouterReady, isPending: routerPending } =
    useSafeRouter();
  const [uniqueId, setUniqueId] = useState(uniqueIdFromQuery);
  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<AuthToast | null>(null);
  const nfcUrlStrippedRef = useRef(false);
  const pendingNfcLoadedRef = useRef(false);
  const isPending = loading || routerPending;

  useEffect(() => {
    if (uniqueIdFromQuery) {
      setUniqueId(uniqueIdFromQuery);
    }
  }, [uniqueIdFromQuery]);

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [emailFromQuery]);

  useEffect(() => {
    const text = authQueryMessageText(msgFromQuery);
    if (text) {
      setToast({ message: text, variant: "info" });
    }
  }, [msgFromQuery]);

  useEffect(() => {
    if (!searchParams.get("nfc")?.trim() || !isRouterReady || nfcUrlStrippedRef.current) {
      return;
    }

    nfcUrlStrippedRef.current = true;
    const nfcFromUrl = uniqueIdFromQuery;

    void (async () => {
      if (nfcFromUrl) {
        setUniqueId(nfcFromUrl);
        try {
          await rememberPendingNfcForAuthAction(nfcFromUrl);
        } catch {
          // Çerez yazılamasa da state'teki uniqueId ile devam edilir.
        }
      }

      const cleanUrl = authLoginPathClean({
        email: emailFromQuery || undefined,
        msg: msgFromQuery || undefined,
      });
      await safeReplace(cleanUrl);
    })();
  }, [
    searchParams,
    uniqueIdFromQuery,
    emailFromQuery,
    msgFromQuery,
    isRouterReady,
    safeReplace,
  ]);

  useEffect(() => {
    if (uniqueIdFromQuery || pendingNfcLoadedRef.current) {
      return;
    }

    pendingNfcLoadedRef.current = true;

    void getPendingNfcIdAction().then((pending) => {
      if (pending) {
        setUniqueId(pending);
      }
    });
  }, [uniqueIdFromQuery]);

  const showToast = useCallback((message: string, variant: AuthToast["variant"] = "error") => {
    setToast({ message, variant });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 12_000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!uniqueId) {
    return (
      <p className="text-center text-sm text-red-200/90">
        NFC kart bilgisi eksik. Lütfen kartınızı tekrar okutun.
      </p>
    );
  }

  const signupHref = nfcAuthSignupPath(uniqueId, { email });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setToast(null);

    logNfcAuthTrace("Tetiklendi", { source: "NfcLoginForm.submit", uniqueId });

    try {
      const result = await startNfcLoginAction({
        email,
        password,
        uniqueId,
        device: {
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          userAgent: navigator.userAgent,
        },
      });

      if (!result.success) {
        if (result.redirectPath) {
          showToast(result.error, "info");
          if (!isRouterReady) {
            window.location.assign(result.redirectPath);
            return;
          }
          await safePush(result.redirectPath);
          return;
        }

        showToast(result.error);
        setLoading(false);
        return;
      }

      navigateAfterNfcAuth(result.redirectTo);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Giriş tamamlanamadı.";
      showToast(message);
      setLoading(false);
    }
  }

  return (
    <>
      {toast ? (
        <div
          role="alert"
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            toast.variant === "error"
              ? "border-red-400/35 bg-red-950/50 text-red-100"
              : "border-amber-400/35 bg-amber-950/40 text-amber-100"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-[11px] uppercase tracking-widest text-white/45">
          E-posta
        </label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@email.com"
          className={authInputClassName}
        />

        <label className="text-[11px] uppercase tracking-widest text-white/45">
          Şifre
        </label>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifreniz"
          className={authInputClassName}
        />

        <button
          type="submit"
          disabled={isPending}
          className={`${authPrimaryButtonClassName} mt-2`}
        >
          {isPending ? "İşleniyor..." : "Giriş Yap"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] text-white/40">
        Giriş yaptığınızda kartınız otomatik eşleştirilir.
      </p>

      <p className="mt-3 text-center text-[11px]">
        <Link
          href={signupHref}
          className="font-medium text-amber-200/90 underline-offset-2 hover:underline"
        >
          Yeni misin? Kayıt Ol
        </Link>
      </p>
    </>
  );
}
