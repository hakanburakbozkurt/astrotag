"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModulePageShell from "@/components/navigation/ModulePageShell";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";
import { noirSecondaryButtonClass } from "@/lib/theme/noir-tokens";

const CosmicProfilePanel = dynamic(
  () => import("@/components/dashboard/CosmicProfilePanel"),
  { loading: () => <TabPageSkeleton /> }
);

export default function KozmikProfilPage() {
  useRequireAuth();
  const router = useRouter();
  const { userData, profileStatus, isPending, error } = useUserProfile();
  const handleClose = useCallback(() => router.push("/dashboard"), [router]);

  if (isPending || profileStatus === "loading") {
    return <TabPageSkeleton />;
  }

  if (!userData) {
    return (
      <div className="relative mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-3 py-10 text-center">
        <p className="text-xs text-stone-500">{error ?? "Profil bilgileri bulunamadı."}</p>
        <Link
          href={`${PROFILE_SETUP_PATH}?mode=edit`}
          className={`mt-4 ${noirSecondaryButtonClass} w-auto px-5`}
        >
          Profili Tamamla
        </Link>
      </div>
    );
  }

  return (
    <ModulePageShell>
      <Suspense fallback={<TabPageSkeleton />}>
        <CosmicProfilePanel
          user={userData}
          onClose={handleClose}
          presentation="inline"
        />
      </Suspense>
    </ModulePageShell>
  );
}
