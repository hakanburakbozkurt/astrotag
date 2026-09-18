"use client";

import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";

export default function PrivateModeWarningPage() {
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
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-stone-300">
            Gizli Sekme Tespit Edildi
          </p>
          <h1 className="mt-4 bg-gradient-to-b from-white to-zinc-900 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
            Normal Sekme Gerekli
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            AstroTag, güvenli NFC oturumu için tarayıcı depolama alanına ihtiyaç
            duyar. Gizli veya gizlilik modunda bu özellik devre dışıdır.
          </p>
          <p className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-xs leading-relaxed text-stone-300">
            Lütfen Chrome veya Safari&apos;de{" "}
            <span className="font-semibold text-stone-300">normal bir sekme</span>{" "}
            açın ve NFC kartınızı tekrar okutun.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
