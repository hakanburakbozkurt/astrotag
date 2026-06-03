"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  sendNfcPairingOtpAction,
  verifyNfcPairingOtpAction,
} from "@/lib/actions/device-auth";
import { navigateAfterNfcAuth } from "@/lib/nfc/post-auth-nav.client";
import { HOME_PATH } from "@/lib/nfc/constants";

type Step = "email" | "otp";

type DeviceBindingFlowProps = {
  uniqueId: string;
};

export default function DeviceBindingFlow({ uniqueId }: DeviceBindingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await sendNfcPairingOtpAction(email, uniqueId);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setStep("otp");
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await verifyNfcPairingOtpAction(
        email,
        otp,
        uniqueId,
        window.screen.width,
        window.screen.height,
        navigator.userAgent
      );

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      navigateAfterNfcAuth(result.redirectTo);
    } catch (cause) {
      console.error("[DeviceBindingFlow] verify/pair failed:", cause);
      if (cause instanceof Error && cause.stack) {
        console.error(cause.stack);
      }
      setError(
        cause instanceof Error ? cause.message : "Kart eşleştirmesi başarısız."
      );
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-sm"
    >
      <p className="mb-6 text-center text-xs uppercase tracking-[0.2em] text-amber-400/70">
        NFC Kartını Eşleştir
      </p>
      <p className="mb-4 text-center text-xs leading-relaxed text-white/45">
        E-postanızı doğrulayın; kart hesabınıza bağlanır ve giriş tamamlanır.
      </p>

      {step === "email" && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <label className="text-left text-[11px] uppercase tracking-widest text-white/45">
            E-posta
          </label>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@email.com"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-500/90 px-4 py-3 text-xs font-medium uppercase tracking-widest text-black transition hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Gönderiliyor..." : "Doğrulama Kodu Gönder"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="text-center text-xs text-white/50">
            <span className="text-white/70">{email}</span> adresine kod gönderildi.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6 haneli kod"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm tracking-[0.3em] text-white outline-none transition focus:border-amber-400/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-500/90 px-4 py-3 text-xs font-medium uppercase tracking-widest text-black transition hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Doğrula ve Giriş Yap"}
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white/60"
          >
            E-postayı değiştir
          </button>
        </form>
      )}

      {error && (
        <p className="mt-6 text-center text-sm text-red-300/90">{error}</p>
      )}

      <button
        type="button"
        onClick={() => router.replace(HOME_PATH)}
        className="mt-8 w-full rounded-xl border border-white/15 px-5 py-2.5 text-xs uppercase tracking-widest text-white/60 transition hover:border-white/30"
      >
        Geri Dön
      </button>
    </motion.div>
  );
}
