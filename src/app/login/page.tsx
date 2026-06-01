"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import {
  authenticateNfcCard,
  checkNfcSessionAction,
} from "@/lib/actions/nfc-auth";
import { PROFILE_COMPLETE_PATH } from "@/lib/nfc/constants";

function isWebNfcSupported(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

function extractNfcPayload(
  serialNumber: string,
  records: Array<{ recordType: string; data?: BufferSource }>
): string {
  const textParts: string[] = [];

  for (const record of records) {
    if (record.recordType === "text" && record.data) {
      const buffer = record.data instanceof ArrayBuffer ? record.data : null;
      if (buffer) {
        const decoded = new TextDecoder().decode(buffer);
        if (decoded.trim()) {
          textParts.push(decoded.trim());
        }
      }
    }
  }

  if (textParts.length > 0) {
    return textParts.join("|");
  }

  return serialNumber.trim();
}

export default function LoginPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nfcSupported, setNfcSupported] = useState(true);

  useEffect(() => {
    setNfcSupported(isWebNfcSupported());

    void checkNfcSessionAction().then((session) => {
      if (session.authenticated) {
        router.replace(PROFILE_COMPLETE_PATH);
        return;
      }
      setIsReady(true);
    });
  }, [router]);

  const handleNfcScan = useCallback(async () => {
    if (isScanning) {
      return;
    }

    setError(null);

    if (!isWebNfcSupported()) {
      setNfcSupported(false);
      setError("Lütfen Chrome kullanın");
      return;
    }

    setIsScanning(true);

    try {
      const NDEFReaderCtor = window.NDEFReader;
      if (!NDEFReaderCtor) {
        setNfcSupported(false);
        setError("Lütfen Chrome kullanın");
        return;
      }

      const reader = new NDEFReaderCtor();
      const abortController = new AbortController();
      const scanTimeout = window.setTimeout(() => abortController.abort(), 30000);

      await reader.scan({ signal: abortController.signal });

      await new Promise<void>((resolve, reject) => {
        reader.onreading = (event) => {
          window.clearTimeout(scanTimeout);
          const payload = extractNfcPayload(
            event.serialNumber,
            event.message.records
          );

          void authenticateNfcCard(payload).then((result) => {
            if (!result.success) {
              reject(new Error(result.error));
              return;
            }
            resolve();
          });
        };

        reader.onreadingerror = () => {
          window.clearTimeout(scanTimeout);
          reject(new Error("NFC okuma hatası. Kartı tekrar yaklaştırın."));
        };
      });

      router.replace(PROFILE_COMPLETE_PATH);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Okuma zaman aşımına uğradı. Tekrar deneyin.");
      } else {
        setError(
          err instanceof Error ? err.message : "NFC doğrulaması başarısız."
        );
      }
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, router]);

  if (!isReady) {
    return (
      <main className="relative min-h-dvh">
        <Starfield />
        <div className="relative flex min-h-dvh items-center justify-center">
          <p className="text-sm text-white/40">Yükleniyor...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Starfield />

      <div className="relative flex min-h-dvh items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full max-w-xs flex-col items-center justify-center text-center"
        >
          <p className="text-sm leading-relaxed text-white/55">
            Lütfen NFC kartını telefonuna yaklaştır
          </p>

          {!nfcSupported ? (
            <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-200/80">
              NFC bu tarayıcıda desteklenmiyor. Lütfen Chrome kullanın (Android,
              HTTPS).
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleNfcScan()}
            disabled={isScanning || !nfcSupported}
            className="mt-10 flex h-14 min-w-[220px] items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/10 px-8 text-sm font-semibold tracking-wide text-amber-100 shadow-[0_0_40px_rgba(251,191,36,0.08)] transition hover:border-amber-400/55 hover:bg-amber-400/18 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isScanning ? "Okunuyor..." : "NFC Kartını Okut"}
          </button>

          {error ? (
            <p
              role="alert"
              className="mt-6 max-w-xs text-sm leading-relaxed text-red-300/90"
            >
              {error}
            </p>
          ) : null}
        </motion.div>
      </div>
    </main>
  );
}
