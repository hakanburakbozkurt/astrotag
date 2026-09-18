"use client";

import { memo } from "react";
import { useQuery } from "@/hooks/useQuery";
import { useStarEconomy } from "@/hooks/useStarEconomy";
import { getWalletBalancesAction } from "@/lib/actions/wallet";
import { Colors } from "@/lib/navigation/dashboard-colors";
import { SWR_KEYS } from "@/lib/auth/data-cache";

function ProfileMenuBalanceInner() {
  const { totalStarPoints, isLoading: starsLoading } = useStarEconomy();
  const { data: wallet } = useQuery(SWR_KEYS.wallet, getWalletBalancesAction);

  return (
    <div className="space-y-2 px-4 py-3">
      <p className={Colors.balanceLabel}>Cüzdan Bakiyesi</p>
      <div className="flex items-center justify-between gap-3">
        <span className={Colors.balanceLabel}>Yıldız</span>
        <span className={Colors.balanceValue}>{starsLoading ? "…" : totalStarPoints}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className={Colors.balanceLabel}>Kristal</span>
        <span className={Colors.balanceValue}>
          {wallet === undefined ? "…" : (wallet?.crystalBalance ?? 0)}
        </span>
      </div>
    </div>
  );
}

export default memo(ProfileMenuBalanceInner);
