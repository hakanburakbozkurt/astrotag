"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";

type AuthMobileShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AuthMobileShell({
  title,
  subtitle,
  children,
}: AuthMobileShellProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#070b14]">
      <Starfield />

      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 20%, rgba(251,191,36,0.14) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex min-h-dvh flex-col justify-center px-5 py-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto w-full max-w-[400px]"
        >
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/75">
            AstroTag
          </p>
          <h1 className="mt-2 text-center text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-center text-sm leading-relaxed text-white/50">
              {subtitle}
            </p>
          ) : null}

          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </main>
  );
}
