"use client";

import Link from "next/link";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";

const NatalScreen = dynamic(
  () => import("@/components/natal-chart/NatalScreen"),
  { loading: () => <TabPageSkeleton /> }
);

export default function NatalTabPage() {
  useRequireAuth();
  const { userData, profileStatus, isLoading, error } = useUserProfile();

  if (isLoading || profileStatus === "loading") {
    return <TabPageSkeleton />;
  }

  if (profileStatus === "error" || !userData) {
    return (
      <div className="relative mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-3 py-10 text-center">
        <p className="text-xs text-white/60">
          {error ?? "Profil bilgileri bulunamadı."}
        </p>
        <Link
          href={`${PROFILE_SETUP_PATH}?mode=edit`}
          className="mt-4 rounded-lg border border-amber-400/30 px-4 py-2 text-xs text-amber-100"
        >
          Profili Tamamla
        </Link>
      </div>
    );
  }

  return (
    <Suspense fallback={<TabPageSkeleton />}>
      <NatalScreen user={userData} />
    </Suspense>
  );
}
