"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";

const CosmicDashboard = dynamic(
  () => import("@/components/dashboard/CosmicDashboard"),
  { loading: () => <TabPageSkeleton /> }
);

export default function DashboardPage() {
  useRequireAuth();
  const { userData, profileStatus, isPending, error } = useUserProfile();

  if (isPending || profileStatus === "loading") {
    return <TabPageSkeleton />;
  }

  if (profileStatus === "error") {
    return (
      <div className="relative mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-3 py-10 text-center">
        <p className="text-[9px] uppercase tracking-[0.22em] text-red-300/70">
          Profil Hatası
        </p>
        <p className="mt-2 text-xs text-white/60">
          {error ?? "Profil bilgileri yüklenemedi."}
        </p>
        <Link
          href={PROFILE_SETUP_PATH}
          className="mt-4 rounded-lg border border-amber-400/30 px-4 py-2 text-xs text-amber-100"
        >
          Profili Tamamla
        </Link>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="relative mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-3 py-10 text-center">
        <p className="text-xs text-white/55">
          Kozmik haritanız için doğum bilgilerinizi tamamlayın.
        </p>
        <Link
          href={`${PROFILE_SETUP_PATH}?mode=edit`}
          className="mt-4 rounded-lg border border-amber-400/30 px-4 py-2 text-xs text-amber-100"
        >
          Profil Kurulumu
        </Link>
      </div>
    );
  }

  return <CosmicDashboard user={userData} />;
}
