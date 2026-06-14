"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";

const OracleHub = dynamic(
  () => import("@/components/navigation/OracleHub"),
  { loading: () => <TabPageSkeleton /> }
);

export default function OracleTabPage() {
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

  if (profileStatus === "error" || !userData) {
    return (
      <div className="relative mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm text-white/60">
          {error ?? "Profil bilgileri bulunamadı."}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 text-xs uppercase tracking-[0.25em] text-amber-400/70"
        >
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <Suspense fallback={<TabPageSkeleton />}>
      <OracleHub user={userData} />
    </Suspense>
  );
}
