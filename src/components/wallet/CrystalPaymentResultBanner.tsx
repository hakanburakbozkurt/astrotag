"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@/hooks/useQuery";
import { getWalletBalancesAction } from "@/lib/actions/wallet";
import { SWR_KEYS } from "@/lib/auth/data-cache";

export default function CrystalPaymentResultBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate } = useQuery(SWR_KEYS.wallet, getWalletBalancesAction);

  const crystalSuccess = searchParams.get("crystalSuccess") === "1";
  const crystalError = searchParams.get("crystalError") === "1";
  const grantedRaw = searchParams.get("granted");
  const granted = grantedRaw ? Number.parseInt(grantedRaw, 10) : null;

  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    if (crystalSuccess || crystalError) {
      setVisible(true);
    }

    if (crystalSuccess) {
      void mutate();
    }
  }, [crystalSuccess, crystalError, mutate]);

  if (!visible) {
    return null;
  }

  if (crystalError) {
    return (
      <div
        role="alert"
        className="mb-4 rounded-sm border border-zinc-800 bg-[#09090b] px-4 py-3"
      >
        <p className="font-serif text-[14px] text-zinc-300">Ödeme tamamlanamadı</p>
        <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
          Kristal yüklemesi doğrulanamadı. Sorun devam ederse destek hattından bize
          ulaşın.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 rounded-sm border border-zinc-700 px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-300 transition hover:border-zinc-600"
        >
          Devam Et
        </button>
      </div>
    );
  }

  if (!crystalSuccess) {
    return null;
  }

  const grantedLabel =
    granted !== null && Number.isFinite(granted) && granted > 0
      ? `${granted} adet kristal cüzdanınıza eklendi`
      : "Kristaller cüzdanınıza eklendi";

  return (
    <div
      role="status"
      className="mb-4 rounded-sm border border-zinc-700 bg-[#09090b] px-4 py-3.5 shadow-[0_0_20px_rgba(239,68,68,0.08)]"
    >
      <div className="flex items-start gap-2">
        <span aria-hidden className="mt-0.5 text-red-500/90">
          ◆
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[15px] text-zinc-100">
            Ödemeniz Başarıyla Gerçekleşti!
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">
            {grantedLabel} 🎉
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-200 transition hover:border-zinc-600"
          >
            Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}
