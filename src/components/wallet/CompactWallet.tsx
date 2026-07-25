"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { useQuery } from "@/hooks/useQuery";
import { useStarEconomy } from "@/hooks/useStarEconomy";
import { getWalletBalancesAction } from "@/lib/actions/wallet";
import { SWR_KEYS } from "@/lib/auth/data-cache";
import CrystalPurchaseModal from "@/components/wallet/CrystalPurchaseModal";

export default function CompactWallet() {
  const { totalStarPoints, isLoading: starsLoading } = useStarEconomy();
  const { data: wallet, mutate } = useQuery(SWR_KEYS.wallet, getWalletBalancesAction);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const crystalBalance = wallet?.crystalBalance ?? 0;

  const refreshWallet = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
        <p className="text-[9px] uppercase tracking-[0.28em] text-white/35">
          Cüzdan
        </p>

        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-white/55">🌟 Yıldız</span>
            <span className="font-mono font-medium text-amber-100">
              {starsLoading ? "…" : totalStarPoints}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-white/55">🔮 Kristal</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-medium text-violet-200">
                {wallet === undefined ? "…" : crystalBalance}
              </span>
              <button
                type="button"
                aria-label="Kristal satın al"
                onClick={() => setPurchaseOpen(true)}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-violet-400/30 bg-violet-500/15 text-violet-200 transition hover:bg-violet-500/25"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <CrystalPurchaseModal
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        onSuccess={() => void refreshWallet()}
      />
    </>
  );
}
