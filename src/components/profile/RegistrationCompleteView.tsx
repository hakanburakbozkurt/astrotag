"use client";

import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import RegistrationCompleteForm from "@/components/profile/RegistrationCompleteForm";

const HERO_IMAGE = "/image_93d8a2.png";

export default function RegistrationCompleteView() {
  return (
    <div className="relative isolate flex min-h-0 w-full flex-1 flex-col overflow-x-hidden bg-[#070b14]">
      <Starfield />

      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(251,191,36,0.12) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-5 py-8 sm:px-6 sm:py-10">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex w-full min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0f172a]/92 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <div
            className="relative aspect-[16/9] w-full shrink-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(to top, #0f172a 0%, transparent 55%), url('${HERO_IMAGE}'), linear-gradient(135deg, #1e293b 0%, #070b14 100%)`,
            }}
            role="img"
            aria-label="AstroTag"
          />

          <div className="flex flex-col p-6 sm:p-8">
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/75">
                Kayıt Tamamla
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
                Profilinizi Oluşturun
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/45">
                Birkaç bilgi ile kaydınızı tamamlayın; ardından panele geçebilirsiniz.
              </p>
            </div>

            <div className="mt-8 w-full min-w-0 max-w-full">
              <RegistrationCompleteForm />
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
