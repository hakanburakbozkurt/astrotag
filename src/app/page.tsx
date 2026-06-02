"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/session-expired");
  }, [router]);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Starfield />

      <div className="relative flex min-h-dvh items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm text-center"
        >
          <h1 className="bg-gradient-to-b from-white via-amber-100 to-amber-300/90 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            AstroTag
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-white/50">
            NFC kartınızı telefonunuza yaklaştırın. Zero-Click giriş otomatik
            başlayacaktır.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/55">
            astrotag.app/c/[kart-id]
          </p>
        </motion.div>
      </div>
    </main>
  );
}
