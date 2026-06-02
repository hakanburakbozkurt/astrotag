"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";

export default function SessionExpiredPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Starfield />

      <div className="relative flex min-h-dvh items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex max-w-md flex-col items-center text-center"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
            Oturum Sona Erdi
          </p>
          <h1 className="mt-4 bg-gradient-to-b from-white to-amber-200/80 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
            Geçersiz Erişim
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            5 dakikalık oturum süreniz doldu veya cihaz eşleşmesi doğrulanamadı.
            Devam etmek için NFC kartınızı tekrar okutun.
          </p>
          <p className="mt-6 text-xs text-white/35">
            AstroTag yalnızca NFC kartı ile Zero-Click giriş destekler.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
