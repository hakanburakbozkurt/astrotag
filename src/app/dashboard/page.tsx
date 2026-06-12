"use client";

import { useEffect } from "react";
import Link from "next/link";
import CosmicDashboard from "@/components/dashboard/CosmicDashboard";
import Starfield from "@/components/Starfield";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { REGISTRATION_COMPLETE_PATH } from "@/lib/nfc/constants";

export default function DashboardPage() {
  useRequireAuth();
  const { userData, profileStatus, isLoading, error } = useUserProfile();

  useEffect(() => {
    if (isLoading || profileStatus === "loading") {
      return;
    }

    if (profileStatus === "empty" || (!userData && profileStatus !== "error")) {
      clientRedirect(REGISTRATION_COMPLETE_PATH);
    }
  }, [isLoading, profileStatus, userData]);

  if (isLoading) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Starfield />
        <div className="relative flex flex-1 items-center justify-center px-4">
          <p className="text-sm text-white/45">Kozmik bağlantı kuruluyor...</p>
        </div>
      </div>
    );
  }

  if (profileStatus === "error") {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Starfield />
        <div className="relative mx-auto flex flex-1 max-w-md flex-col items-center justify-center px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.25em] text-red-300/70">
            Profil Hatası
          </p>
          <p className="mt-3 text-sm text-white/60">
            {error ?? "Profil bilgileri yüklenemedi."}
          </p>
          <Link
            href={REGISTRATION_COMPLETE_PATH}
            className="mt-6 rounded-xl border border-amber-400/30 px-5 py-2.5 text-sm text-amber-100"
          >
            Kaydı Tamamla
          </Link>
        </div>
      </div>
    );
  }

  if (profileStatus === "empty" || !userData) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Starfield />
        <div className="relative flex flex-1 items-center justify-center px-4">
          <p className="text-sm text-white/45">Kayıt sayfasına yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <Starfield />
      <CosmicDashboard user={userData} />
    </div>
  );
}
