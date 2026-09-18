"use client";

import Link from "next/link";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModulePageShell from "@/components/navigation/ModulePageShell";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";

const NexusTabContent = dynamic(
  () => import("@/components/tabs/NexusTabContent"),
  { loading: () => <TabPageSkeleton /> }
);

export default function NexusTabPage() {
  useRequireAuth();
  const { userData, profileStatus, isPending, error } = useUserProfile();

  if (isPending || profileStatus === "loading") {
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
          className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-xs text-stone-300"
        >
          Profili Tamamla
        </Link>
      </div>
    );
  }

  return (
    <ModulePageShell>
      <Suspense fallback={<TabPageSkeleton />}>
        <NexusTabContent />
      </Suspense>
    </ModulePageShell>
  );
}
