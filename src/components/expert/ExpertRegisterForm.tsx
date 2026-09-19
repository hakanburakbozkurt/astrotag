"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { registerExpertApplicationAction } from "@/lib/actions/expert-auth";
import { validatePasswordPair } from "@/lib/auth/password-rules";
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
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [title, setTitle] = useState("");
  const [tradition, setTradition] = useState<string>(EXPERT_TRADITION_OPTIONS[0]);
  const [experienceYears, setExperienceYears] = useState("1");
  const [aboutText, setAboutText] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [socialProfileUrl, setSocialProfileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<
    "login_required" | "validation" | "auth" | "server" | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const parsedExperienceYears = useMemo(
    () => Math.max(0, Number.parseInt(experienceYears, 10) || 0),
    [experienceYears]
  );
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const passwordValidationError = useMemo(() => {
    if (!password && !confirmPassword) {
      return null;
    }

    return validatePasswordPair(password, confirmPassword);
  }, [confirmPassword, password]);

  const canSubmit =
    name.trim().length >= 2 &&
    title.trim().length >= 2 &&
    tradition.trim().length >= 2 &&
    phoneNumber.trim().length >= 10 &&
    socialProfileUrl.trim().length >= 4 &&
    isValidEmail(normalizedEmail) &&
    !passwordValidationError &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    !passwordsMismatch &&
    !loading;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const clientPasswordError = validatePasswordPair(password, confirmPassword);
    if (clientPasswordError) {
      setError(clientPasswordError);
      setErrorCode("validation");
      return;
    }

    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCode(null);
    setSuccessMessage(null);
    setRequiresEmailConfirmation(false);

    try {
      const result = await registerExpertApplicationAction({
        email: normalizedEmail,
        password,
        confirmPassword,
        name: name.trim(),
        title: title.trim(),
        tradition: tradition.trim(),
        experienceYears: parsedExperienceYears,
        aboutText: aboutText.trim(),
        phoneNumber: phoneNumber.trim(),
        socialProfileUrl: socialProfileUrl.trim(),
      });

      if (!result.ok) {
        setError(result.error);
        setErrorCode(result.errorCode ?? null);
        return;
      }

      setSuccessMessage(result.message);
      setRequiresEmailConfirmation(result.requiresEmailConfirmation === true);

      if (result.redirectTo && !result.requiresEmailConfirmation) {
        router.push(result.redirectTo);
        return;
      }

      if (result.redirectTo && result.requiresEmailConfirmation) {
        window.setTimeout(() => {
          router.push(result.redirectTo);
        }, 4000);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Başvuru gönderilemedi.");
    } finally {
      setLoading(false);
    }
  }

  if (successMessage) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="rounded-sm border border-zinc-800 bg-zinc-900 px-4 py-4 text-sm text-stone-300">
          {successMessage}
        </p>
        {requiresEmailConfirmation ? (
          <p className="text-[11px] text-stone-500">
            E-posta doğrulamasından sonra{" "}
            <Link href={EXPERT_LOGIN_PATH} className="text-stone-300 underline-offset-2 hover:underline">
              uzman giriş
            </Link>{" "}
            sayfasından devam edebilirsiniz.
          </p>
        ) : (
          <p className="text-[11px] text-stone-500">
            Başvurunuz admin onayından sonra vitrinde yayınlanır.
          </p>
        )}
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
        Şifre
      </label>
      <input
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="En az 8 karakter"
        className={authInputClassName}
      />

      <label className="text-[11px] uppercase tracking-widest text-white/45">
        Şifre Tekrar
      </label>
      <input
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Şifrenizi tekrar girin"
        aria-invalid={passwordsMismatch}
        className={`${authInputClassName}${
          passwordsMismatch ? " border-zinc-700 ring-1 ring-red-400/30" : ""
        }`}
      />
      {passwordsMismatch ? (
        <p className="-mt-2 text-xs text-stone-400" role="alert">
          Şifreler eşleşmiyor. Lütfen aynı şifreyi iki alana da girin.
        </p>
      ) : null}
      {!passwordsMismatch && passwordValidationError && confirmPassword.length > 0 ? (
        <p className="-mt-2 text-xs text-stone-400" role="alert">
          {passwordValidationError}
        </p>
      ) : null}

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
        Telefon Numarası
      </label>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        minLength={10}
        value={phoneNumber}
        onChange={(event) => setPhoneNumber(event.target.value)}
        placeholder="05xx xxx xx xx"
        className={authInputClassName}
      />

      <label className="text-[11px] uppercase tracking-widest text-white/45">
        Sosyal Medya Profili
      </label>
      <input
        type="url"
        inputMode="url"
        required
        minLength={4}
        value={socialProfileUrl}
        onChange={(event) => setSocialProfileUrl(event.target.value)}
        placeholder="https://instagram.com/kullaniciadi"
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
        <div
          role="alert"
          className="rounded-sm border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-stone-400"
        >
          <p>{error}</p>
          {errorCode === "login_required" ? (
            <p className="mt-2 text-xs text-stone-500">
              Mevcut hesabınızla{" "}
              <Link
                href={`${EXPERT_LOGIN_PATH}${normalizedEmail ? `?email=${encodeURIComponent(normalizedEmail)}` : ""}`}
                className="font-medium text-stone-300 underline underline-offset-2 hover:text-stone-100"
              >
                uzman giriş
              </Link>{" "}
              sayfasından devam edebilirsiniz.
            </p>
          ) : null}
          {errorCode === "auth" ? (
            <p className="mt-2 text-xs text-stone-500">
              Sorun devam ederse bir süre bekleyip tekrar deneyin veya giriş sayfasını
              kullanın.
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`${authPrimaryButtonClassName} mt-2`}
      >
        {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
      </button>

      <p className="text-center text-[11px] text-stone-500">
        Başvurunuz admin onayından geçer. Telefon ve sosyal medya bilgileriniz
        doğrulama için kullanılır. Hesabınız e-posta ve şifre ile oluşturulur.
      </p>

      <p className="mt-2 text-center text-[11px]">
        <Link
          href={EXPERT_LOGIN_PATH}
          className="font-medium text-stone-300 underline-offset-2 hover:underline"
        >
          Zaten kayıtlı mısınız? Giriş Yap
        </Link>
      </p>
    </form>
  );
}
