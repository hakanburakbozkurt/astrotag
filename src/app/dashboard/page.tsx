"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";

const CosmicDashboard = dynamic(
  () => import("@/components/dashboard/CosmicDashboard"),
  { loading: () => <TabPageSkeleton /> }
);

export default function DashboardPage() {
  useRequireAuth();
  const { userData, profileStatus, isLoading, error } = useUserProfile();

  useEffect(() => {
    if (isLoading || profileStatus === "loading") {
      return;
    }

    if (profileStatus === "empty" || (!userData && profileStatus !== "error")) {
      clientRedirect(PROFILE_SETUP_PATH);
    }
  }, [isLoading, profileStatus, userData]);

  if (isLoading || profileStatus === "loading") {
    return <TabPageSkeleton />;
  }

  if (profileStatus === "error") {
    return (
      <div className="relative mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
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
    );
  }

  if (profileStatus === "empty" || !userData) {
    return (
      <div className="relative flex flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-white/45">Kayıt sayfasına yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<TabPageSkeleton />}>
      <CosmicDashboard user={userData} />
    </Suspense>
  );
}
