"use client";

import { memo, useState } from "react";
import { Plus } from "lucide-react";
import BuyCrystalModal from "@/components/BuyCrystalModal";
import { useQuery } from "@/hooks/useQuery";
import { useStarEconomy } from "@/hooks/useStarEconomy";
import { getWalletBalancesAction } from "@/lib/actions/wallet";
import { Colors } from "@/lib/navigation/dashboard-colors";
import { SWR_KEYS } from "@/lib/auth/data-cache";

function ProfileMenuBalanceInner() {
  const { totalStarPoints, isLoading: starsLoading } = useStarEconomy();
  const { data: wallet } = useQuery(SWR_KEYS.wallet, getWalletBalancesAction);
  const [buyModalOpen, setBuyModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-2 px-4 py-3">
        <p className={Colors.balanceLabel}>Cüzdan Bakiyesi</p>
        <div className="flex items-center justify-between gap-3">
          <span className={Colors.balanceLabel}>Yıldız</span>
          <span className={Colors.balanceValue}>{starsLoading ? "…" : totalStarPoints}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className={Colors.balanceLabel}>Kristal</span>
          <div className="flex items-center gap-1.5">
            <span className={Colors.balanceValue}>
              {wallet === undefined ? "…" : (wallet?.crystalBalance ?? 0)}
            </span>
            <button
              type="button"
              aria-label="Kristal satın al"
              onClick={() => setBuyModalOpen(true)}
              className="flex h-5 w-5 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-950 text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-300"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <BuyCrystalModal
        open={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
      />
    </>
  );
}

export default memo(ProfileMenuBalanceInner);
