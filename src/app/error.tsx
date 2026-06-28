"use client";

import { useEffect, useState } from "react";
import StaleActionRecovery from "@/components/errors/StaleActionRecovery";
import { isStaleServerActionError } from "@/lib/errors/stale-server-action";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  const [isStaleAction, setIsStaleAction] = useState(() => isStaleServerActionError(error));
  const [recoveryFailed, setRecoveryFailed] = useState(false);

  useEffect(() => {
    setIsStaleAction(isStaleServerActionError(error));
  }, [error]);

  if (isStaleAction && !recoveryFailed) {
    return <StaleActionRecovery onGiveUp={() => setRecoveryFailed(true)} />;
  }

  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
        Kozmik Kesinti
      </p>
      <h1 className="mt-3 text-xl font-semibold text-white">Bir şeyler ters gitti</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/50">
        {recoveryFailed
          ? "Güncelleme otomatik tamamlanamadı. Sayfayı yenileyerek tekrar deneyin."
          : "Beklenmeyen bir hata oluştu. Tekrar deneyebilir veya sayfayı yenileyebilirsiniz."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/80 transition hover:border-white/20 hover:text-white"
        >
          Tekrar Dene
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-amber-500/95 px-5 py-2.5 text-sm font-medium text-[#0f172a] transition hover:bg-amber-400"
        >
          Sayfayı Yenile
        </button>
      </div>
    </div>
  );
}
