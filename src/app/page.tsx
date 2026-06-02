"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import { NFC_SHOP_URL, WELCOME_IMAGE_PATH } from "@/lib/nfc/constants";

export default function WelcomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#070b14]">
      <Starfield />

      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(251,191,36,0.12) 0%, transparent 65%)",
        }}
      />

      <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full max-w-md flex-col items-center text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative mb-8"
          >
            <div className="absolute -inset-6 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 shadow-[0_0_80px_rgba(251,191,36,0.15)] backdrop-blur-sm">
              <Image
                src={WELCOME_IMAGE_PATH}
                alt="AstroTag NFC anahtarlık"
                width={280}
                height={280}
                priority
                className="h-auto w-[min(280px,75vw)] rounded-[1.5rem] object-contain"
              />
            </div>
          </motion.div>

          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/70">
            Kozmik NFC Deneyimi
          </p>
          <h1 className="mt-3 bg-gradient-to-b from-white via-amber-50 to-amber-300/90 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            AstroTag
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
            Anahtarlığınızı telefonunuza yaklaştırın; profiliniz Zero-Click
            olarak açılır.
          </p>

          <Link
            href={NFC_SHOP_URL}
            target={NFC_SHOP_URL.startsWith("http") ? "_blank" : undefined}
            rel={NFC_SHOP_URL.startsWith("http") ? "noopener noreferrer" : undefined}
            className="mt-10 flex h-12 w-full max-w-xs items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-400/20 to-amber-500/10 text-sm font-semibold tracking-wide text-amber-50 shadow-[0_0_32px_rgba(251,191,36,0.12)] transition hover:border-amber-400/60 hover:from-amber-400/28 hover:to-amber-500/16"
          >
            NFC anahtarlık satın al
          </Link>

          <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
            astrotag.vercel.app
          </p>
        </motion.div>
      </div>
    </main>
  );
}
