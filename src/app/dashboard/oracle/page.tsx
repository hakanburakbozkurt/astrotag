"use client";

import Link from "next/link";
import { useEffect } from "react";
import OracleHub from "@/components/navigation/OracleHub";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";

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

  if (isLoading) {
    return (
      <div className="relative flex flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-white/45">Oracle merkezi yükleniyor...</p>
      </div>
    );
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

  return <OracleHub user={userData} />;
}
