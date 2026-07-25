"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { sendExpertRegisterLinkAction } from "@/lib/actions/expert-auth";
import {
  formatExpertCodeInput,
  isValidExpertCode,
} from "@/lib/expert/expert-codes.shared";
import { EXPERT_LOGIN_PATH } from "@/lib/expert/expert-paths";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ExpertRegisterForm() {
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const normalizedInvite = useMemo(
    () => formatExpertCodeInput(inviteCode),
    [inviteCode]
  );
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const canSubmit =
    isValidExpertCode(normalizedInvite) &&
    name.trim().length >= 2 &&
    isValidEmail(normalizedEmail) &&
    !loading;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError(null);
    setSent(false);

    try {
      const result = await sendExpertRegisterLinkAction({
        email: normalizedEmail,
        inviteCode: normalizedInvite,
        name: name.trim(),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kayıt bağlantısı gönderilemedi.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 px-4 py-4 text-sm text-emerald-100">
          Kayıt bağlantısı{" "}
          <span className="font-medium text-white">{normalizedEmail}</span>{" "}
          adresine gönderildi. Bağlantıya tıkladığınızda uzman hesabınız oluşturulur
          ve panele yönlendirilirsiniz.
        </p>
        <p className="text-[11px] text-white/40">
          Davet kodu, bağlantıyı onayladığınızda tek kullanımlık olarak tüketilir.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-[11px] font-medium text-amber-200/90 underline-offset-2 hover:underline"
        >
          Bilgileri düzenle
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4" noValidate>
      <label className="text-[11px] uppercase tracking-widest text-white/45">
        Davet Kodu (8 hane)
      </label>
      <input
        type="text"
        inputMode="numeric"
        required
        maxLength={8}
        value={inviteCode}
        onChange={(event) => setInviteCode(formatExpertCodeInput(event.target.value))}
        placeholder="Tek kullanımlık kod"
        className={`${authInputClassName} text-center font-mono tracking-[0.35em]`}
      />

      <label className="text-[11px] uppercase tracking-widest text-white/45">
        Ad Soyad
      </label>
      <input
        type="text"
        autoComplete="name"
        required
        minLength={2}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Adınız Soyadınız"
        className={authInputClassName}
      />

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
        {loading ? "Gönderiliyor..." : "Kayıt Bağlantısı Gönder"}
      </button>

      <p className="text-center text-[11px] text-white/40">
        PIN veya şifre gerekmez. E-postanıza doğrulama bağlantısı gönderilir.
      </p>

      <p className="mt-2 text-center text-[11px]">
        <Link
          href={EXPERT_LOGIN_PATH}
          className="font-medium text-amber-200/90 underline-offset-2 hover:underline"
        >
          Zaten kayıtlı mısınız? Giriş Yap
        </Link>
      </p>
    </form>
  );
}
