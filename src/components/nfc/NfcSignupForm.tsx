"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import { authQueryMessageText } from "@/lib/auth/auth-query-messages";
import { logNfcAuthTrace } from "@/lib/auth/nfc-auth-debug";
import { startNfcSignupAction } from "@/lib/actions/nfc-email-auth";
import { authSignupPathClean, nfcAuthLoginPath } from "@/lib/nfc/auth-paths";
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

type NfcSignupFormProps = {
  initialNfcId?: string;
};

export default function NfcSignupForm({ initialNfcId = "" }: NfcSignupFormProps) {
  const searchParams = useSearchParams();
  const { safePush, isRouterReady, safeReplace, isPending: routerPending } =
    useSafeRouter();
  const [uniqueId, setUniqueId] = useState(initialNfcId);
  const [email, setEmail] = useState(() => searchParams.get("email")?.trim() ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      authSignupPathClean({
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

  const loginHref = nfcAuthLoginPath(uniqueId, { email });

  async function submitSignup() {
    if (isSubmittingRef.current || loading || !uniqueId) {
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setToast(null);

    logNfcAuthTrace("Tetiklendi", { source: "NfcSignupForm.submit", uniqueId });

    try {
      const result = await startNfcSignupAction({
        email,
        password,
        confirmPassword,
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

      if (result.skipOtp) {
        navigateAfterNfcAuth(result.redirectTo);
        return;
      }

      if (!isRouterReady) {
        throw new Error("Router henüz hazır değil. Lütfen tekrar deneyin.");
      }

      await safePush(result.redirectTo);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Kayıt tamamlanamadı.";
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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="En az 8 karakter"
          className={authInputClassName}
        />

        <label className="text-[11px] uppercase tracking-widest text-white/45">
          Şifre tekrar
        </label>
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Şifrenizi tekrar girin"
          className={authInputClassName}
        />

        <button
          type="button"
          disabled={isPending}
          onClick={() => void submitSignup()}
          className={`${authPrimaryButtonClassName} mt-2`}
        >
          {isPending ? "İşleniyor..." : "Kayıt Ol"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] text-white/40">
        Yeni hesaplarda e-postanıza 6 haneli doğrulama kodu gönderilir.
      </p>

      <p className="mt-3 text-center text-[11px]">
        <Link
          href={loginHref}
          className="font-medium text-amber-200/90 underline-offset-2 hover:underline"
        >
          Hesabın var mı? Giriş Yap
        </Link>
      </p>
    </>
  );
}
