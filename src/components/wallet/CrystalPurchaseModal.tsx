"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  initCrystalCheckoutAction,
  listCrystalPackagesAction,
} from "@/lib/actions/wallet";

type CrystalPackage = Awaited<ReturnType<typeof listCrystalPackagesAction>>[number];

type CrystalPurchaseModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CrystalPurchaseModal({
  open,
  onClose,
  onSuccess,
}: CrystalPurchaseModalProps) {
  const [packages, setPackages] = useState<CrystalPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await listCrystalPackagesAction();
        setPackages(rows);
      } catch {
        setError("Paketler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const handlePurchase = async (packageId: string) => {
    setBusyId(packageId);
    setError(null);

    try {
      const result = await initCrystalCheckoutAction(packageId);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.devMode) {
        window.location.href = result.checkoutUrl;
        return;
      }

      window.location.href = result.checkoutUrl;
      onSuccess?.();
    } catch {
      setError("Ödeme başlatılamadı.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[24px] border border-violet-400/20 bg-[#0f172a] p-5 shadow-2xl"
          >
            <p className="text-[10px] uppercase tracking-[0.28em] text-violet-300/70">
              Kristal Paketleri
            </p>
            <p className="mt-2 text-sm text-white/55">
              Uzman seansları için kristal satın alın. Ödeme İyzico ile güvenli
              şekilde işlenir.
            </p>

            {loading ? (
              <p className="mt-6 text-sm text-white/45">Yükleniyor…</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {packages.map((pkg) => (
                  <li key={pkg.id}>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void handlePurchase(pkg.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-violet-400/25 disabled:opacity-60"
                    >
                      <div>
                        <p className="text-sm font-medium text-white/90">
                          {pkg.title}
                          {pkg.badge ? (
                            <span className="ml-2 text-[10px] uppercase tracking-wider text-violet-300/80">
                              {pkg.badge}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-white/45">
                          {pkg.crystals} 🔮 Kristal
                        </p>
                      </div>
                      <span className="font-mono text-sm text-violet-200">
                        {busyId === pkg.id ? "…" : `₺${pkg.priceTry}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {error ? <p className="mt-3 text-xs text-red-300/85">{error}</p> : null}

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl border border-white/10 py-2.5 text-xs uppercase tracking-widest text-white/50"
            >
              Kapat
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
