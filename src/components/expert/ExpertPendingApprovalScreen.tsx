"use client";

import { motion } from "framer-motion";

type ExpertPendingApprovalScreenProps = {
  displayName?: string;
  compact?: boolean;
};

export default function ExpertPendingApprovalScreen({
  displayName,
  compact = false,
}: ExpertPendingApprovalScreenProps) {
  const greeting = displayName?.trim() ? `${displayName.trim()}, ` : "";

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[24px] border border-zinc-700 bg-gradient-to-br from-zinc-800/0.08 to-transparent p-4 backdrop-blur-xl"
      >
        <p className="text-[10px] uppercase tracking-[0.28em] text-stone-300">
          Uzman Başvurusu
        </p>
        <p className="mt-2 text-sm text-white/80">
          {greeting}uzmanlık başvurunuz inceleniyor. Onaylandığında vitrinde yerinizi
          alacaksınız.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[28px] border border-zinc-700 bg-[#0f172a]/85 p-6 backdrop-blur-2xl sm:p-8"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 55%)",
        }}
      />

      <div className="relative text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
          <span className="text-xl" aria-hidden="true">
            ✦
          </span>
        </div>

        <p className="mt-5 text-[10px] uppercase tracking-[0.32em] text-stone-300">
          Onay Bekleniyor
        </p>

        <h2 className="mt-3 text-lg font-medium text-white/95">
          {greeting}başvurunuz inceleniyor
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">
          Uzmanlık başvurunuz ekibimiz tarafından değerlendiriliyor. Onaylandığında
          Uzmanlar vitrininde yerinizi alacak, hizmet ve içerik eklemeye
          başlayabileceksiniz.
        </p>

        <p className="mt-5 text-[11px] text-white/35">
          Bu süreçte panele giriş yapabilirsiniz; vitrin yayını admin onayından sonra
          açılır.
        </p>
      </div>
    </motion.section>
  );
}
