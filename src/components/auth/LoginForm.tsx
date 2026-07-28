"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import { AUTH_FORGOT_PASSWORD_PATH } from "@/lib/auth/auth-config";
import { authQueryMessageText } from "@/lib/auth/auth-query-messages";
import { startLoginAction } from "@/lib/actions/auth-email";
import { AUTH_SIGNUP_PATH } from "@/lib/nfc/constants";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";

type AuthToast = {
  message: string;
  variant: "error" | "info";
};

type LoginFormProps = {
  /** Opsiyonel — NFC etiketinden gelindiyse kart eşlemesi denenir */
  optionalNfcId?: string;
};

export default function LoginForm({ optionalNfcId = "" }: LoginFormProps) {
  const searchParams = useSearchParams();
  const { safePush, isRouterReady, isPending: routerPending } = useSafeRouter();
  const [email, setEmail] = useState(() => searchParams.get("email")?.trim() ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<AuthToast | null>(null);
  const isSubmittingRef = useRef(false);
  const isPending = loading || routerPending;

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

  const signupHref = `${AUTH_SIGNUP_PATH}${email ? `?email=${encodeURIComponent(email)}` : ""}`;

  async function submitLogin() {
    if (isSubmittingRef.current || loading) {
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setToast(null);

    try {
      const result = await startLoginAction({
        email,
        password,
        uniqueId: optionalNfcId || undefined,
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
      showToast(cause instanceof Error ? cause.message : "Giriş başarısız.");
    } finally {
      isSubmittingRef.current = false;
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

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitLogin();
        }}
        className="flex flex-col gap-4"
        noValidate
      >
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
          placeholder="En az 8 karakter"
          className={authInputClassName}
        />

        <Link
          href={`${AUTH_FORGOT_PASSWORD_PATH}${email ? `?email=${encodeURIComponent(email)}` : ""}`}
          className="-mt-1 text-right text-[11px] text-amber-200/80 hover:underline"
        >
          Şifremi unuttum
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className={`${authPrimaryButtonClassName} mt-2`}
        >
          {isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px]">
        <Link
          href={signupHref}
          className="font-medium text-amber-200/90 underline-offset-2 hover:underline"
        >
          Hesabın yok mu? Kayıt Ol
        </Link>
      </p>
    </>
  );
}
