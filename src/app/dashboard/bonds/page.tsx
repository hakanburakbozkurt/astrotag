"use client";

import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";

const BondsTabContent = dynamic(
  () => import("@/components/tabs/BondsTabContent"),
  { loading: () => <TabPageSkeleton /> }
);

export default function BondsTabPage() {
  useRequireAuth();
  const { userData, profileStatus, isLoading } = useUserProfile();

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

  if (profileStatus === "empty" || !userData) {
    return (
      <div className="relative flex flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-white/45">Yönlendiriliyor...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<TabPageSkeleton />}>
      <BondsTabContent />
    </Suspense>
  );
}
