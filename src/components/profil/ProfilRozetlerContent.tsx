"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import ProfilPageShell from "@/components/profil/ProfilPageShell";
import { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";

const AchievementsSection = dynamic(
  () => import("@/components/badges/AchievementsSection"),
  { loading: () => <SectionSkeleton title="Rozetlerim" /> }
);

export default function ProfilRozetlerContent() {
  return (
    <ProfilPageShell eyebrow="Profil" title="Rozetlerim" description="Kazandığınız rozetler.">
      <Suspense fallback={<SectionSkeleton title="Rozetlerim" />}>
        <AchievementsSection />
      </Suspense>
    </ProfilPageShell>
  );
}
