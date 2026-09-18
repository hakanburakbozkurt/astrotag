"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import ModulePageShell from "@/components/navigation/ModulePageShell";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";

const ManifestoWidget = dynamic(
  () => import("@/components/home/ManifestoWidget"),
  { loading: () => <TabPageSkeleton /> }
);

export default function ManifestPage() {
  useRequireAuth();
  const { userData, profileStatus, isPending, error } = useUserProfile();

  if (isPending || profileStatus === "loading") {
    return <TabPageSkeleton />;
  }

  if (!userData) {
    return (
      <div className="relative mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-3 py-10 text-center">
        <p className="text-xs text-stone-500">{error ?? "Profil bilgileri bulunamadı."}</p>
        <Link
          href={`${PROFILE_SETUP_PATH}?mode=edit`}
          className="mt-4 rounded-sm border border-zinc-700 px-4 py-2 text-xs text-stone-300"
        >
          Profili Tamamla
        </Link>
      </div>
    );
  }

  return (
    <ModulePageShell>
      <Suspense fallback={<TabPageSkeleton />}>
        <ManifestoWidget user={userData} />
      </Suspense>
    </ModulePageShell>
  );
}
