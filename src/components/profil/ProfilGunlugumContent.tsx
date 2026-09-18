"use client";

import ProfilPageShell from "@/components/profil/ProfilPageShell";
import JournalTabs from "@/components/profil/JournalTabs";

export default function ProfilGunlugumContent() {
  return (
    <ProfilPageShell
      eyebrow="Profil"
      title="Günlüğüm"
      description="Okuma arşivi ve kozmik manifesto geçmişi."
    >
      <JournalTabs />
    </ProfilPageShell>
  );
}
