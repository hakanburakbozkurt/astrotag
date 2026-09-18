"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import TabPageSkeleton from "@/components/navigation/TabPageSkeleton";
import { useRequireAuth, useUserProfile } from "@/lib/auth";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";
import type { UserData } from "@/types/user";

interface ProfilPageGateProps {
  children: (user: UserData | null) => ReactNode;
  requireUser?: boolean;
}

export default function ProfilPageGate({ children, requireUser = true }: ProfilPageGateProps) {
  useRequireAuth();
  const { userData, profileStatus, isPending, error } = useUserProfile();

  if (isPending || profileStatus === "loading") {
    return <TabPageSkeleton />;
  }

  if (requireUser && !userData) {
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

  return <>{children(userData)}</>;
}
