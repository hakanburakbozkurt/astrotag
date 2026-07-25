"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sendExpertLoginLinkAction } from "@/lib/actions/expert-auth";
import { EXPERT_REGISTER_PATH } from "@/lib/expert/expert-paths";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ExpertLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const canSubmit = isValidEmail(normalizedEmail) && !loading;

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) {
      setError(authError);
    }
  }, [searchParams]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError(null);
    setSent(false);

    try {
      const result = await sendExpertLoginLinkAction({ email: normalizedEmail });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Giriş bağlantısı gönderilemedi.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 px-4 py-4 text-sm text-emerald-100">
          Giriş bağlantısı{" "}
          <span className="font-medium text-white">{normalizedEmail}</span>{" "}
          adresine gönderildi. E-postanızdaki bağlantıya tıklayarak Uzman Panelinize
          erişebilirsiniz.
        </p>
        <p className="text-[11px] text-white/40">
          Bağlantıyı göremiyorsanız spam klasörünü kontrol edin.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-[11px] font-medium text-amber-200/90 underline-offset-2 hover:underline"
        >
          Farklı e-posta dene
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4" noValidate>
      <label className="text-[11px] uppercase tracking-widest text-white/45">
        E-posta Adresi
      </label>
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="uzman@ornek.com"
        className={authInputClassName}
      />

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-100"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`${authPrimaryButtonClassName} mt-2`}
      >
        {loading ? "Gönderiliyor..." : "Giriş Bağlantısı Gönder"}
      </button>

      <p className="text-center text-[11px] text-white/40">
        Şifre gerekmez. E-postanıza tek tıkla giriş bağlantısı gönderilir.
      </p>

      <p className="mt-2 text-center text-[11px]">
        <Link
          href={EXPERT_REGISTER_PATH}
          className="font-medium text-amber-200/90 underline-offset-2 hover:underline"
        >
          Uzman başvurusu yapın
        </Link>
      </p>
    </form>
  );
}
