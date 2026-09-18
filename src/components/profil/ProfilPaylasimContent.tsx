"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import ProfilPageShell from "@/components/profil/ProfilPageShell";
import { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";

const ReferralPanel = dynamic(
  () => import("@/components/dashboard/ReferralPanel"),
  { loading: () => <SectionSkeleton title="Kozmik Paylaşım" /> }
);

export default function ProfilPaylasimContent() {
  return (
    <ProfilPageShell
      eyebrow="Profil"
      title="Paylaşım"
      description="Davet kodunuz ve kozmik paylaşım ayarları."
    >
      <Suspense fallback={<SectionSkeleton title="Kozmik Paylaşım" />}>
        <ReferralPanel />
      </Suspense>
    </ProfilPageShell>
  );
}
