"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import {
  confirmStorageAccessAction,
  initiateZeroClickSession,
} from "@/lib/actions/nfc-auth";
import { getDeviceFingerprint } from "@/lib/nfc/device-fingerprint";
import { isPrivateBrowsingMode } from "@/lib/nfc/private-mode";
import {
  HOME_PATH,
  PRIVATE_MODE_PATH,
} from "@/lib/nfc/constants";

type EntryState = "loading" | "activating" | "error";

export default function NfcCardEntryPage() {
  const router = useRouter();
  const params = useParams<{ unique_id: string }>();
  const uniqueId = params.unique_id;
  const startedRef = useRef(false);

  const [state, setState] = useState<EntryState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uniqueId || startedRef.current) {
      return;
    }

    startedRef.current = true;

    void (async () => {
      setState("activating");

      try {
        if (await isPrivateBrowsingMode()) {
          router.replace(PRIVATE_MODE_PATH);
          return;
        }

        await confirmStorageAccessAction();

        const fingerprint = await getDeviceFingerprint();
        const result = await initiateZeroClickSession(
          uniqueId,
          fingerprint,
          navigator.userAgent
        );

        if (!result.success) {
          setError(result.error);
          setState("error");
          return;
        }

        router.replace(result.redirectTo);
      } catch {
        setError("Oturum başlatılamadı. Lütfen tekrar deneyin.");
        setState("error");
      }
    })();
  }, [uniqueId, router]);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Starfield />

      <div className="relative flex min-h-dvh items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex max-w-sm flex-col items-center text-center"
        >
          {state === "error" ? (
            <>
              <p className="text-sm leading-relaxed text-red-300/90">{error}</p>
              <button
                type="button"
                onClick={() => router.replace(HOME_PATH)}
                className="mt-8 rounded-xl border border-white/15 px-5 py-2.5 text-xs uppercase tracking-widest text-white/60 transition hover:border-white/30"
              >
                Geri Dön
              </button>
            </>
          ) : (
            <>
              <div className="h-10 w-10 animate-pulse rounded-full border border-amber-400/30 bg-amber-400/10" />
              <p className="mt-6 text-sm text-white/55">
                {state === "loading"
                  ? "Hazırlanıyor..."
                  : "Cihaz parmak izi eşleştiriliyor..."}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400/60">
                Zero-Click NFC
              </p>
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}
