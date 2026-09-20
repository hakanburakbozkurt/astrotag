"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import ProfilPageShell from "@/components/profil/ProfilPageShell";
import PersonalAvatarSection from "@/components/profile/PersonalAvatarSection";
import UserBirthSection from "@/components/profil/UserBirthSection";
import { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";
import type { UserData } from "@/types/user";

const ProfileInfoSection = dynamic(
  () => import("@/components/profile/ProfileInfoSection"),
  { loading: () => <SectionSkeleton title="Partner bilgileri" /> }
);

interface ProfilBilgilerContentProps {
  user: UserData;
}

export default function ProfilBilgilerContent({ user }: ProfilBilgilerContentProps) {
  return (
    <ProfilPageShell
      eyebrow="Profil"
      title="Kişisel Bilgiler"
      description="Profil fotoğrafı, doğum verileriniz ve partner bilgileriniz."
    >
      <div className="space-y-6">
        <PersonalAvatarSection displayName={user.name} />
        <UserBirthSection user={user} />
      </div>
      <Suspense fallback={<SectionSkeleton title="Partner bilgileri" />}>
        <ProfileInfoSection />
      </Suspense>
    </ProfilPageShell>
  );
}
