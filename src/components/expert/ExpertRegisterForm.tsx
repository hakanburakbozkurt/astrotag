"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { sendExpertRegisterLinkAction } from "@/lib/actions/expert-auth";
import { EXPERT_TRADITION_OPTIONS } from "@/lib/expert/expert-approval.shared";
import { EXPERT_LOGIN_PATH } from "@/lib/expert/expert-paths";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ExpertRegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [tradition, setTradition] = useState<string>(EXPERT_TRADITION_OPTIONS[0]);
  const [experienceYears, setExperienceYears] = useState("1");
  const [aboutText, setAboutText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const parsedExperienceYears = useMemo(
    () => Math.max(0, Number.parseInt(experienceYears, 10) || 0),
    [experienceYears]
  );

  const canSubmit =
    name.trim().length >= 2 &&
    title.trim().length >= 2 &&
    tradition.trim().length >= 2 &&
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
        name: name.trim(),
        title: title.trim(),
        tradition: tradition.trim(),
        experienceYears: parsedExperienceYears,
        aboutText: aboutText.trim(),
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
          Doğrulama bağlantısı{" "}
          <span className="font-medium text-white">{normalizedEmail}</span>{" "}
          adresine gönderildi. Bağlantıyı onayladığınızda başvurunuz incelenmek üzere
          kaydedilir.
        </p>
        <p className="text-[11px] text-white/40">
          Onay sonrası Uzmanlar vitrininde yerinizi alabilirsiniz.
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

      <label className="text-[11px] uppercase tracking-widest text-white/45">
        Unvan
      </label>
      <input
        type="text"
        required
        minLength={2}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Örn. Kozmik Rehber"
        className={authInputClassName}
      />

      <label className="text-[11px] uppercase tracking-widest text-white/45">
        Uzmanlık Alanı
      </label>
      <select
        required
        value={tradition}
        onChange={(event) => setTradition(event.target.value)}
        className={authInputClassName}
      >
        {EXPERT_TRADITION_OPTIONS.map((option) => (
          <option key={option} value={option} className="bg-[#0f172a] text-white">
            {option}
          </option>
        ))}
      </select>

      <label className="text-[11px] uppercase tracking-widest text-white/45">
        Deneyim (yıl)
      </label>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={60}
        required
        value={experienceYears}
        onChange={(event) => setExperienceYears(event.target.value)}
        className={authInputClassName}
      />

      <label className="text-[11px] uppercase tracking-widest text-white/45">
        Kısa Tanıtım
      </label>
      <textarea
        rows={3}
        value={aboutText}
        onChange={(event) => setAboutText(event.target.value)}
        placeholder="Kendinizi ve çalışma tarzınızı kısaca anlatın…"
        className={`${authInputClassName} resize-none`}
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
        {loading ? "Gönderiliyor..." : "Başvuru Bağlantısı Gönder"}
      </button>

      <p className="text-center text-[11px] text-white/40">
        Şifre gerekmez. E-postanıza doğrulama bağlantısı gönderilir; onay sonrası
        vitrinde yer alırsınız.
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
