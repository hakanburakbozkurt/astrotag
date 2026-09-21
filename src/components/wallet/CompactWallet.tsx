"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery } from "@/hooks/useQuery";
import { useStarEconomy } from "@/hooks/useStarEconomy";
import { getWalletBalancesAction } from "@/lib/actions/wallet";
import { SWR_KEYS } from "@/lib/auth/data-cache";
import CrystalCheckoutModal from "@/components/wallet/CrystalCheckoutModal";

export default function CompactWallet() {
  const searchParams = useSearchParams();
  const { totalStarPoints, isLoading: starsLoading } = useStarEconomy();
  const { data: wallet, mutate } = useQuery(SWR_KEYS.wallet, getWalletBalancesAction);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const crystalBalance = wallet?.crystalBalance ?? 0;

  const refreshWallet = useCallback(async () => {
    await mutate();
  }, [mutate]);

  useEffect(() => {
    const crystalSuccess = searchParams.get("crystalSuccess");
    const crystalError = searchParams.get("crystalError");
    const granted = searchParams.get("granted");

    if (crystalSuccess === "1") {
      void refreshWallet();
      toast.success(
        granted
          ? `${granted} kristal cüzdanınıza yüklendi.`
          : "Kristal satın alma tamamlandı."
      );
    } else if (crystalError === "1") {
      toast.error("Kristal ödemesi tamamlanamadı veya doğrulanamadı.");
    }
  }, [refreshWallet, searchParams]);

  return (
    <>
      <section className="rounded-sm border border-zinc-800 bg-[#09090b] px-4 py-3">
        <p className="text-[9px] uppercase tracking-wider text-zinc-600">Cüzdan</p>

        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-zinc-500">Yıldız</span>
            <span className="font-mono font-medium text-zinc-300">
              {starsLoading ? "…" : totalStarPoints}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-zinc-500">
              <span aria-hidden className="text-red-500/85">
                ◆
              </span>{" "}
              Kristal
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-medium text-zinc-300">
                {wallet === undefined ? "…" : crystalBalance}
              </span>
              <button
                type="button"
                aria-label="Kristal satın al"
                onClick={() => setPurchaseOpen(true)}
                className="flex h-6 w-6 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-950 text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-300"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <CrystalCheckoutModal
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        onSuccess={() => void refreshWallet()}
      />
    </>
  );
}
