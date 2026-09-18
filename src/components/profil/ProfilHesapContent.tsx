"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import ProfilPageShell from "@/components/profil/ProfilPageShell";
import FreezeAccountSection from "@/components/settings/FreezeAccountSection";
import { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";

const DeleteAccountSection = dynamic(
  () => import("@/components/settings/DeleteAccountSection"),
  { loading: () => <SectionSkeleton title="Hesap silme" /> }
);

export default function ProfilHesapContent() {
  return (
    <ProfilPageShell
      eyebrow="Profil"
      title="Hesap"
      description="Hesabınızı dondurun veya kalıcı olarak silin."
    >
      <FreezeAccountSection />
      <Suspense fallback={<SectionSkeleton title="Hesap silme" />}>
        <DeleteAccountSection />
      </Suspense>
    </ProfilPageShell>
  );
}
