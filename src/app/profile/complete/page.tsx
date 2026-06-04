"use client";

import { useEffect, useRef, useState } from "react";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { useAppRouter } from "@/lib/auth/router-ready-context.client";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import ProfileCompleteForm from "@/components/profile/ProfileCompleteForm";
import { checkNfcSessionAction } from "@/lib/actions/nfc-auth";
import { DASHBOARD_PATH, HOME_PATH } from "@/lib/nfc/constants";
import { useUserProfile } from "@/lib/auth";

export default function ProfileCompletePage() {
  const { isMounted, isPending } = useAppRouter();
  const { profileStatus, isLoading, userData, isAuthenticated } = useUserProfile();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionOk, setSessionOk] = useState(true);
  const redirectStartedRef = useRef(false);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const session = await checkNfcSessionAction();
      if (cancelled) {
        return;
      }

      setSessionOk(session.authenticated);
      setSessionChecked(true);

      if (!session.authenticated && !redirectStartedRef.current) {
        redirectStartedRef.current = true;
        clientRedirect(HOME_PATH);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isMounted]);

  useEffect(() => {
    if (
      !isMounted ||
      !sessionChecked ||
      !sessionOk ||
      isLoading ||
      profileStatus !== "ready" ||
      !userData ||
      redirectStartedRef.current
    ) {
      return;
    }

    redirectStartedRef.current = true;
    clientRedirect(DASHBOARD_PATH);
  }, [isMounted, sessionChecked, sessionOk, isLoading, profileStatus, userData]);

  const showRedirectShell =
    isPending ||
    !sessionChecked ||
    !sessionOk ||
    (profileStatus === "ready" && Boolean(userData));

  if (showRedirectShell || isLoading || !isAuthenticated) {
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
