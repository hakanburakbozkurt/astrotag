"use client";

import { useCallback, useEffect, useState } from "react";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import {
  logNfcAuthSupabaseError,
  logNfcAuthTrace,
} from "@/lib/auth/nfc-auth-debug";
import {
  startNfcEmailAuthAction,
  type NfcEmailAuthMode,
} from "@/lib/actions/nfc-email-auth";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";

type NfcLoginFormProps = {
  uniqueId: string;
};

type AuthToast = {
  message: string;
  variant: "error" | "info";
};

export default function NfcLoginForm({ uniqueId }: NfcLoginFormProps) {
  const { safePush, isRouterReady, isPending: routerPending } = useSafeRouter();
  const [mode, setMode] = useState<NfcEmailAuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isPending = loading || routerPending;
  const [toast, setToast] = useState<AuthToast | null>(null);

  const isSignup = mode === "signup";

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

  function switchMode(next: NfcEmailAuthMode) {
    setMode(next);
    setToast(null);
    if (next === "login") {
      setConfirmPassword("");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setToast(null);

    logNfcAuthTrace("Tetiklendi", {
      source: "NfcLoginForm.submit",
      uniqueId,
      mode,
    });

    try {
      const result = await startNfcEmailAuthAction({
        email,
        password,
        confirmPassword: isSignup ? confirmPassword : password,
        uniqueId,
        mode,
        device: {
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          userAgent: navigator.userAgent,
        },
      });

      if (!result.success) {
        logNfcAuthTrace("Hata yakalandı", { source: "NfcLoginForm", uniqueId, mode });

        if (result.switchToLogin) {
          setMode("login");
          showToast(result.error, "info");
          setLoading(false);
          return;
        }

        console.error(
          "NFC_AUTH: [NfcLoginForm] action başarısız",
          JSON.stringify({ error: result.error, mode }, null, 2)
        );
        showToast(result.error);
        setLoading(false);
        return;
      }

      logNfcAuthTrace("submit başarılı", {
        source: "NfcLoginForm",
        skipOtp: Boolean(result.skipOtp),
        mode,
      });

      if (result.skipOtp) {
        navigateAfterNfcAuth(result.redirectTo);
        return;
      }

      if (!isRouterReady) {
        throw new Error("Router henüz hazır değil. Lütfen tekrar deneyin.");
      }

      await safePush(result.redirectTo);
    } catch (cause) {
      logNfcAuthTrace("Hata yakalandı", { source: "NfcLoginForm.catch", uniqueId, mode });
      logNfcAuthSupabaseError("NfcLoginForm.catch", cause, { uniqueId });
      const message =
        cause instanceof Error ? cause.message : "İşlem tamamlanamadı.";
      showToast(message);
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0f172a]/90 p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-widest text-white/45">
          {isSignup ? "Yeni hesap" : "Giriş yap"}
        </p>
        <button
          type="button"
          onClick={() => switchMode(isSignup ? "login" : "signup")}
          className="text-[11px] font-medium text-amber-200/90 underline-offset-2 hover:text-amber-100 hover:underline"
        >
          {isSignup ? "Hesabın var mı? Giriş Yap" : "Yeni misin? Kayıt Ol"}
        </button>
      </div>

      {toast ? (
        <div
          role="alert"
          aria-live="assertive"
          className={`mb-4 rounded-xl border px-4 py-3 text-sm leading-relaxed shadow-lg ${
            toast.variant === "error"
              ? "border-red-400/35 bg-red-950/50 text-red-100"
              : "border-amber-400/35 bg-amber-950/40 text-amber-100"
          }`}
        >
          <p className="font-mono text-[9px] uppercase tracking-widest opacity-70">
            {toast.variant === "error" ? "İşlem hatası" : "Bilgi"}
          </p>
          <p className="mt-1">{toast.message}</p>
          {toast.variant === "error" && isSignup ? (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mt-3 text-[11px] font-medium text-amber-200 underline-offset-2 hover:underline"
            >
              Hesabın var mı? Giriş Yap
            </button>
          ) : null}
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
          inputMode="email"
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
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="En az 8 karakter"
          className={authInputClassName}
        />

        {isSignup ? (
          <>
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
          </>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className={`${authPrimaryButtonClassName} mt-2`}
        >
          {isPending
            ? "İşleniyor..."
            : isSignup
              ? "Kayıt Ol"
              : "Giriş Yap"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-white/40">
        {isSignup
          ? "Yeni hesaplarda e-postanıza 6 haneli doğrulama kodu gönderilir."
          : "Kayıtlı hesabınla giriş yaptığında kartın otomatik eşleştirilir."}
      </p>
    </div>
  );
}
