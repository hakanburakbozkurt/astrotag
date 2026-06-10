"use client";

import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import ProfileSetupForm from "@/components/profile/ProfileSetupForm";

export default function ProfileSetupPage() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden">
      <Starfield />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-10 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full min-w-0 rounded-[28px] border border-white/10 bg-[#0f172a]/85 p-6 backdrop-blur-2xl sm:p-8"
        >
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/70">
              Profil Kurulumu
            </p>
            <h1 className="mt-2 bg-gradient-to-b from-white to-amber-200/80 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
              AstroTag
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/45">
              Ad, doğum bilgilerinizi ve kart PIN kodunuzu girin. İlk girişte bu
              adım zorunludur.
            </p>
          </div>

          <div className="mt-8">
            <ProfileSetupForm />
          </div>
        </motion.section>
      </div>
    </main>
  );
}
