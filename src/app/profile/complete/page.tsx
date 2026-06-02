"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import ProfileCompleteForm from "@/components/profile/ProfileCompleteForm";
import { checkNfcSessionAction } from "@/lib/actions/nfc-auth";
import { SESSION_EXPIRED_PATH } from "@/lib/nfc/constants";
import { useUserProfile } from "@/lib/auth";

export default function ProfileCompletePage() {
  const router = useRouter();
  const { profileStatus, isLoading, userData, isAuthenticated } = useUserProfile();

  useEffect(() => {
    void checkNfcSessionAction().then((session) => {
      if (!session.authenticated) {
        router.replace(SESSION_EXPIRED_PATH);
      }
    });
  }, [router]);

  useEffect(() => {
    if (!isLoading && profileStatus === "ready" && userData) {
      router.replace("/dashboard");
    }
  }, [isLoading, profileStatus, userData, router]);

  if (isLoading || !isAuthenticated || (profileStatus === "ready" && userData)) {
    return (
      <main className="relative min-h-dvh">
        <Starfield />
        <div className="relative flex min-h-dvh items-center justify-center px-4">
          <p className="text-sm text-white/45">Yönlendiriliyor...</p>
        </div>
      </main>
    );
  }

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
              Profil Tamamlama
            </p>
            <h1 className="mt-2 bg-gradient-to-b from-white to-amber-200/80 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
              AstroTag
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/45">
              Kozmik danışmanlık için doğum bilgilerinizi girin.
            </p>
          </div>

          <div className="mt-8">
            <ProfileCompleteForm />
          </div>
        </motion.section>
      </div>
    </main>
  );
}
