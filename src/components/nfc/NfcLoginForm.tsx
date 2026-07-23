"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import { authQueryMessageText } from "@/lib/auth/auth-query-messages";
import { logNfcAuthTrace } from "@/lib/auth/nfc-auth-debug";
import WhatsAppRecoveryLink from "@/components/support/WhatsAppRecoveryLink";
import { startNfcLoginAction } from "@/lib/actions/nfc-email-auth";
import { authLoginPathClean, nfcAuthSignupPath } from "@/lib/nfc/auth-paths";
import { persistNfcIdClient, readNfcIdClient } from "@/lib/nfc/nfc-id-persist.client";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";

type AuthToast = {
  message: string;
  variant: "error" | "info";
};

type NfcLoginFormProps = {
  initialNfcId?: string;
};

export default function NfcLoginForm({ initialNfcId = "" }: NfcLoginFormProps) {
  const searchParams = useSearchParams();
  const { safePush, safeReplace, isRouterReady, isPending: routerPending } =
    useSafeRouter();
  const [uniqueId, setUniqueId] = useState(initialNfcId);
  const [email, setEmail] = useState(() => searchParams.get("email")?.trim() ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<AuthToast | null>(null);
  const isCleaned = useRef(false);
  const nfcHydratedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const isPending = loading || routerPending;

  useEffect(() => {
    if (nfcHydratedRef.current || isSubmittingRef.current) {
      return;
    }

    const nfcParam = searchParams.get("nfc")?.trim();
    const nfcId = nfcParam
      ? normalizeNfcUniqueId(nfcParam)
      : initialNfcId || readNfcIdClient() || "";

    if (!nfcId) {
      return;
    }

    nfcHydratedRef.current = true;
    setUniqueId(nfcId);
    persistNfcIdClient(nfcId);
  }, [initialNfcId]);

  useEffect(() => {
    if (isCleaned.current || isSubmittingRef.current || !isRouterReady) {
      return;
    }

    const nfcParam = searchParams.get("nfc")?.trim();
    if (!nfcParam) {
      return;
    }

    isCleaned.current = true;

    const emailParam = searchParams.get("email")?.trim() ?? "";
    const msgParam = searchParams.get("msg")?.trim() ?? "";

    void safeReplace(
      authLoginPathClean({
        email: emailParam || undefined,
        msg: msgParam || undefined,
      })
    );
  }, [isRouterReady, safeReplace]);

  useEffect(() => {
    const emailParam = searchParams.get("email")?.trim();
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const msgParam = searchParams.get("msg")?.trim() ?? "";
    const text = authQueryMessageText(msgParam);
    if (text) {
      setToast({ message: text, variant: "info" });
    }
  }, [searchParams]);

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

  async function submitLogin() {
    if (isSubmittingRef.current || loading || !uniqueId) {
      return;
    }

    isSubmittingRef.current = true;
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
        return;
      }

      navigateAfterNfcAuth(result.redirectTo);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Giriş tamamlanamadı.";
      showToast(message);
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  }

  function blockNativeSubmit(event: React.FormEvent) {
    event.preventDefault();
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

      <form onSubmit={blockNativeSubmit} className="flex flex-col gap-4" noValidate>
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
          type="button"
          disabled={isPending}
          onClick={() => void submitLogin()}
          className={`${authPrimaryButtonClassName} mt-2`}
        >
          {isPending ? "İşleniyor..." : "Giriş Yap"}
        </button>
      </form>

      <WhatsAppRecoveryLink context={{ kind: "nfc", uniqueId }} label="Şifremi Unuttum" />

      <p className="mt-2 text-center text-[11px] text-white/40">
        Şifre sıfırlama yalnızca WhatsApp destek hattı üzerinden yapılır.
      </p>

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
