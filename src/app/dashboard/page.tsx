"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import CosmicDashboard from "@/components/dashboard/CosmicDashboard";
import Starfield from "@/components/Starfield";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";
import type { ModuleId } from "@/components/dashboard/modules/config";

export default function DashboardPage() {
  useRequireAuth();
  const searchParams = useSearchParams();
  const openModuleId = searchParams.get("module") as ModuleId | null;
  const { userData, profileStatus, isLoading, error } = useUserProfile();

  useEffect(() => {
    if (isLoading || profileStatus === "loading") {
      return;
    }

    if (profileStatus === "empty" || (!userData && profileStatus !== "error")) {
      clientRedirect(PROFILE_SETUP_PATH);
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
            href={PROFILE_SETUP_PATH}
            className="mt-6 rounded-xl border border-amber-400/30 px-5 py-2.5 text-sm text-amber-100"
          >
            Profili Tamamla
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
      <CosmicDashboard user={userData} openModuleId={openModuleId} />
    </div>
  );
}
