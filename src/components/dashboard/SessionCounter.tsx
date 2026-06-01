"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EnergyRulesPopup } from "@/components/dashboard/EnergyRulesPopup";
import {
  ENERGY_PER_CHARGE,
  MAX_COSMIC_ENERGY,
} from "@/lib/constants/cosmic";
import type { EnergyChargeState } from "@/lib/energy-charge";
import {
  chargeCosmicEnergy,
  getEnergyChargeState,
} from "@/lib/supabase-actions";
import { formatCountdown, SupabaseActionError } from "@/lib/supabase-action-error";
import { COSMIC_ENERGY_UPDATED_EVENT } from "@/lib/energy-events";

function EnergyInfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Enerji kuralları"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-sm text-white/50 transition hover:border-amber-400/30 hover:text-amber-200/80"
      >
        ?
      </button>
      <EnergyRulesPopup open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default function SessionCounter() {
  const [chargeState, setChargeState] = useState<EnergyChargeState>({
    energy: 0,
    energyBonus: 0,
    totalEnergy: 0,
    lastEnergyCharge: null,
    canCharge: true,
    isFull: false,
    nextChargeAt: null,
  });
  const [cooldown, setCooldown] = useState("00:00:00");
  const [isLoading, setIsLoading] = useState(true);
  const [isCharging, setIsCharging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    try {
      setError(null);
      const energyState = await getEnergyChargeState();
      setChargeState(energyState);
    } catch (err) {
      const message =
        err instanceof SupabaseActionError
          ? err.message
          : "Enerji bilgisi alınamadı.";
      setError(message);
      setChargeState({
        energy: 0,
        energyBonus: 0,
        totalEnergy: 0,
        lastEnergyCharge: null,
        canCharge: false,
        isFull: false,
        nextChargeAt: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  useEffect(() => {
    const handleEnergyUpdated = () => {
      void refreshState();
    };

    window.addEventListener(COSMIC_ENERGY_UPDATED_EVENT, handleEnergyUpdated);
    return () => {
      window.removeEventListener(COSMIC_ENERGY_UPDATED_EVENT, handleEnergyUpdated);
    };
  }, [refreshState]);

  useEffect(() => {
    if (!chargeState.nextChargeAt) {
      setCooldown("00:00:00");
      return;
    }

    const updateCooldown = () => {
      const remaining = formatCountdown(chargeState.nextChargeAt);
      setCooldown(remaining);

      if (remaining === "00:00:00") {
        void refreshState();
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [chargeState.nextChargeAt, refreshState]);

  const handleChargeEnergy = async () => {
    if (isCharging || !chargeState.canCharge) return;

    setIsCharging(true);
    setError(null);

    try {
      const result = await chargeCosmicEnergy();
      setChargeState(result.chargeState);
    } catch (err) {
      const message =
        err instanceof SupabaseActionError
          ? err.message
          : "Enerji yüklenemedi.";
      setError(message);
    } finally {
      setIsCharging(false);
    }
  };

  const { energy, energyBonus, totalEnergy } = chargeState;
  const fillPercent = Math.min(100, Math.round((energy / MAX_COSMIC_ENERGY) * 100));
  const isOnCooldown = Boolean(chargeState.nextChargeAt);

  const buttonLabel = isCharging
    ? "Yükleniyor..."
    : chargeState.isFull
      ? "Enerji Dolu (100/100)"
      : isOnCooldown
        ? `Sonraki: ${cooldown}`
        : `Enerji Doldur (+${ENERGY_PER_CHARGE})`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:mb-8 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-amber-400/70">
          Kozmik Enerji
        </p>
        <EnergyInfoButton />
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-white/45">Enerji yükleniyor...</p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-sm font-medium text-white/80">
              Enerji:{" "}
              <span className="font-mono text-amber-100">
                {energy}/{MAX_COSMIC_ENERGY}
              </span>
            </p>
            {energyBonus > 0 ? (
              <p className="text-xs text-emerald-300/80">
                Bonus +{energyBonus} · Toplam {totalEnergy}
              </p>
            ) : null}
          </div>

          <div
            className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]"
            role="progressbar"
            aria-valuenow={energy}
            aria-valuemin={0}
            aria-valuemax={MAX_COSMIC_ENERGY}
            aria-label={`Kozmik enerji ${energy} / ${MAX_COSMIC_ENERGY}`}
          >
            <motion.div
              initial={false}
              animate={{ width: `${fillPercent}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-amber-500/70 via-amber-400 to-amber-200/90 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleChargeEnergy()}
            disabled={isCharging || !chargeState.canCharge}
            className="min-h-11 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buttonLabel}
          </button>
        </div>
      )}

      {error ? (
        <p className="mt-3 text-xs text-red-300/80">{error}</p>
      ) : null}
    </motion.section>
  );
}
