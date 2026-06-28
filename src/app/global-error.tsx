"use client";

import { useEffect, useState } from "react";
import StaleActionRecovery from "@/components/errors/StaleActionRecovery";
import { isStaleServerActionError } from "@/lib/errors/stale-server-action";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [isStaleAction, setIsStaleAction] = useState(() => isStaleServerActionError(error));
  const [recoveryFailed, setRecoveryFailed] = useState(false);

  useEffect(() => {
    setIsStaleAction(isStaleServerActionError(error));
  }, [error]);

  if (isStaleAction && !recoveryFailed) {
    return (
      <html lang="tr">
        <body className="bg-[#070b14] text-white">
          <StaleActionRecovery onGiveUp={() => setRecoveryFailed(true)} />
        </body>
      </html>
    );
  }

  return (
    <html lang="tr">
      <body className="flex min-h-dvh items-center justify-center bg-[#070b14] px-6 text-white">
        <div className="w-full max-w-md text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
            Kozmik Kesinti
          </p>
          <h1 className="mt-3 text-xl font-semibold">Bir şeyler ters gitti</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            {recoveryFailed
              ? "Güncelleme otomatik tamamlanamadı. Sayfayı yenileyerek tekrar deneyin."
              : "Beklenmeyen bir hata oluştu."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/80"
            >
              Tekrar Dene
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-amber-500/95 px-5 py-2.5 text-sm font-medium text-[#0f172a]"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
