"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import { useAuth } from "@/lib/auth";
import { isDevAuthBypassActive, isDevMode, setDevModeLoggedIn } from "@/lib/dev-mode";
import { supabase } from "@/lib/supabase";

const fieldClass =
  "mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white outline-none transition-all placeholder:text-white/20 focus:ring-2 focus:ring-amber-400/30 [color-scheme:dark]";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDevLoggingIn, setIsDevLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showDevLogin = isDevMode();

  useEffect(() => {
    if (isDevAuthBypassActive()) {
      router.replace("/dashboard");
      return;
    }

    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) {
          throw signInError;
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (signUpError) {
          throw signUpError;
        }
      }

      router.replace("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Giriş işlemi başarısız oldu.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevLogin = async () => {
    if (!showDevLogin || isDevLoggingIn || isSubmitting) {
      return;
    }

    setIsDevLoggingIn(true);
    setError(null);

    try {
      const response = await fetch("/api/dev/test-login", { method: "POST" });
      const data = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        dev_mode_logged_in?: boolean;
        error?: string;
      };

      if (data.access_token && data.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (sessionError) {
          console.warn("Dev session set failed:", sessionError.message);
        }
      }

      if (response.ok && data.dev_mode_logged_in) {
        setDevModeLoggedIn();
        router.replace("/dashboard");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Geliştirici girişi başarısız oldu.");
      }

      setDevModeLoggedIn();
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Geliştirici girişi başarısız oldu.";
      setError(message);
    } finally {
      setIsDevLoggingIn(false);
    }
  };

  const isBusy = isSubmitting || isDevLoggingIn;

  if (authLoading || user || isDevAuthBypassActive()) {
    return (
      <main className="relative min-h-dvh">
        <Starfield />
        <div className="relative flex min-h-dvh items-center justify-center px-4">
          <p className="text-sm text-white/45">Yönlendiriliyor...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh">
      <Starfield />

      <div className="relative mx-auto flex min-h-dvh max-w-sm items-center px-5 py-10">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={(event) => void handleSubmit(event)}
          className="relative w-full rounded-[32px] border border-white/10 bg-[#0f172a]/80 p-8 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-10"
        >
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-amber-400/60">
              ASTROTAG
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              {mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
            </h1>
            <p className="mt-3 text-sm text-white/40">
              Kozmik yolculuğunuza devam etmek için oturum açın.
            </p>
          </div>

          <div className="mt-8 space-y-5">
            <label htmlFor="email" className="block">
              <span className="text-[10px] uppercase tracking-widest text-white/60">
                E-posta
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="ornek@email.com"
                className={fieldClass}
              />
            </label>

            <label htmlFor="password" className="block">
              <span className="text-[10px] uppercase tracking-widest text-white/60">
                Şifre
              </span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                className={fieldClass}
              />
            </label>

            {error ? <p className="text-sm text-red-300/80">{error}</p> : null}

            <button
              type="submit"
              disabled={isBusy}
              className="h-14 w-full rounded-2xl border border-amber-400/30 bg-amber-400/10 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "İşleniyor..."
                : mode === "login"
                  ? "Giriş Yap"
                  : "Kayıt Ol"}
            </button>

            {showDevLogin ? (
              <button
                type="button"
                onClick={() => void handleDevLogin()}
                disabled={isBusy}
                className="h-11 w-full rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-xs font-medium uppercase tracking-[0.18em] text-white/45 transition hover:border-amber-400/25 hover:text-amber-200/70 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDevLoggingIn ? "Test Girişi..." : "Geliştirici Test Girişi"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setMode((current) => (current === "login" ? "signup" : "login"));
                setError(null);
              }}
              disabled={isBusy}
              className="w-full text-sm text-white/45 transition hover:text-amber-200/80 disabled:opacity-60"
            >
              {mode === "login"
                ? "Hesabın yok mu? Kayıt ol"
                : "Zaten hesabın var mı? Giriş yap"}
            </button>
          </div>
        </motion.form>
      </div>
    </main>
  );
}
