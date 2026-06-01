"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  applyReferralCode,
  getReferralInfo,
  type ReferralInfo,
} from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";

const tapButtonClass =
  "min-h-11 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/30";

export default function ReferralPanel() {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [friendCode, setFriendCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const referral = await getReferralInfo();
      setInfo(referral);
    } catch (err) {
      setError(
        err instanceof SupabaseActionError
          ? err.message
          : "Referans bilgisi yüklenemedi."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInfo();
  }, [loadInfo]);

  const handleCopy = async () => {
    if (!info?.referralCode) return;

    try {
      await navigator.clipboard.writeText(info.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kod kopyalanamadı.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !friendCode.trim() || info?.hasUsedReferral) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await applyReferralCode(friendCode);
      setInfo(updated);
      setFriendCode("");
      setMessage("Referans kodu uygulandı! Her ikiniz de +50 bonus enerji kazandınız.");
    } catch (err) {
      setError(
        err instanceof SupabaseActionError
          ? err.message
          : "Referans kodu uygulanamadı."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-amber-400/70">
        Kozmik Paylaşım
      </p>

      {isLoading ? (
        <p className="mt-3 text-sm text-white/45">Referans bilgisi yükleniyor...</p>
      ) : info ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-white/45">Senin kodun</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <p className="min-h-11 flex flex-1 items-center rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 font-mono text-lg font-semibold tracking-wider text-amber-100">
                {info.referralCode}
              </p>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className={`${tapButtonClass} w-full sm:w-auto sm:min-w-[120px]`}
              >
                {copied ? "Kopyalandı" : "Kopyala"}
              </button>
            </div>
          </div>

          {info.hasUsedReferral ? (
            <p className="text-sm text-white/50">
              Bir referans kodu kullandınız. Bonus enerjiniz: +{info.energyBonus}
            </p>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
              <label className="block">
                <span className="text-xs text-white/45">Arkadaşının kodu</span>
                <input
                  value={friendCode}
                  onChange={(event) => setFriendCode(event.target.value.toUpperCase())}
                  placeholder="REFASTRO-XXXXXX"
                  className={`${fieldClass} mt-2 font-mono uppercase tracking-wider`}
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting || !friendCode.trim()}
                className={`${tapButtonClass} w-full`}
              >
                {isSubmitting ? "Uygulanıyor..." : "Kodu Kullan (+50 Bonus)"}
              </button>
            </form>
          )}

          {message ? <p className="text-sm text-amber-200/80">{message}</p> : null}
          {error ? <p className="text-sm text-red-300/80">{error}</p> : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-red-300/80">{error ?? "Referans bilgisi alınamadı."}</p>
      )}
    </motion.section>
  );
}
