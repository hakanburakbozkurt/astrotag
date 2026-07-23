"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { registerExpertAction } from "@/lib/actions/expert-auth";
import {
  formatExpertCodeInput,
  isValidExpertCode,
} from "@/lib/expert/expert-codes.shared";
import { EXPERT_LOGIN_PATH } from "@/lib/expert/expert-paths";
import { isPinInputReady, normalizePinInput } from "@/lib/nfc/pin-input";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";
import { recordClientLastLogin } from "@/lib/nfc/last-login-persist.client";
import WhatsAppRecoveryLink from "@/components/support/WhatsAppRecoveryLink";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-field-styles";

export default function ExpertRegisterForm() {
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const normalizedInvite = useMemo(
    () => formatExpertCodeInput(inviteCode),
    [inviteCode]
  );
  const pinDigits = useMemo(() => normalizePinInput(pin), [pin]);
  const confirmDigits = useMemo(() => normalizePinInput(confirmPin), [confirmPin]);

  const canSubmit =
    isValidExpertCode(normalizedInvite) &&
    name.trim().length >= 2 &&
    isPinInputReady(pinDigits) &&
    pinDigits === confirmDigits &&
    !loading;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canSubmit) {
      if (pinDigits !== confirmDigits) {
        setError("PIN kodları eşleşmiyor.");
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await registerExpertAction({
        inviteCode: normalizedInvite,
        name: name.trim(),
        pin: pinDigits,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.expertCode) {
        setSuccessCode(result.expertCode);
      }

      recordClientLastLogin();
      navigateAfterNfcAuth(result.redirectTo);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kayıt tamamlanamadı.");
    } finally {
      setLoading(false);
    }
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
        PIN Belirle
      </label>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="new-password"
        required
        minLength={4}
        maxLength={8}
        value={pin}
        onChange={(event) =>
          setPin(normalizePinInput(event.target.value).slice(0, 8))
        }
        placeholder="••••"
        className={`${authInputClassName} text-center text-xl tracking-[0.45em]`}
      />

      <label className="text-[11px] uppercase tracking-widest text-white/45">
        PIN Tekrar
      </label>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="new-password"
        required
        minLength={4}
        maxLength={8}
        value={confirmPin}
        onChange={(event) =>
          setConfirmPin(normalizePinInput(event.target.value).slice(0, 8))
        }
        placeholder="••••"
        className={`${authInputClassName} text-center text-xl tracking-[0.45em]`}
      />

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-100"
        >
          {error}
        </p>
      ) : null}

      {successCode ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
          Uzman kodunuz: <span className="font-mono font-semibold">{successCode}</span>
          {" "}— girişlerde bu kodu kullanın.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`${authPrimaryButtonClassName} mt-2`}
      >
        {loading ? "Kaydediliyor..." : "Kayıt Ol"}
      </button>

      <WhatsAppRecoveryLink
        context={{ kind: "expert", expertCode: normalizedInvite || "00000000" }}
        label="Şifremi Unuttum"
      />

      <p className="text-center text-[11px] text-white/40">
        E-posta doğrulaması yoktur. Davet kodu tek kullanımlıktır.
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
