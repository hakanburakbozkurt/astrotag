"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { motion } from "framer-motion";
import TabPageScaffold from "@/components/navigation/TabPageScaffold";
import TabPageSkeleton, { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";
import SignOutButton from "@/components/dashboard/SignOutButton";
import { useUserProfile } from "@/lib/auth";
import type { UserData } from "@/types/user";

const SessionCounter = dynamic(
  () => import("@/components/dashboard/SessionCounter"),
  { loading: () => <SectionSkeleton title="Yıldız Puanı" /> }
);

const CosmicJournal = dynamic(
  () => import("@/components/dashboard/CosmicJournal"),
  { loading: () => <SectionSkeleton title="Kozmik Günlüğüm" /> }
);

const AchievementsSection = dynamic(
  () => import("@/components/badges/AchievementsSection"),
  { loading: () => <SectionSkeleton title="Rozetlerim" /> }
);

const ProfileInfoSection = dynamic(
  () => import("@/components/profile/ProfileInfoSection"),
  { loading: () => <SectionSkeleton title="Partner & Astro-Bağ" /> }
);

const ReferralPanel = dynamic(
  () => import("@/components/dashboard/ReferralPanel"),
  { loading: () => <SectionSkeleton title="Davet" /> }
);

const AdminUserBanPanel = dynamic(
  () => import("@/components/admin/AdminUserBanPanel"),
  { loading: () => <SectionSkeleton title="Admin · Hesap Yönetimi" /> }
);

function ProfileSectionHeading({ title }: { title: string }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.32em] text-white/35">
      {title}
    </p>
  );
}

function UserInfoSection({ user }: { user: UserData }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6"
    >
      <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
        Kişisel Bilgiler
      </p>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Ad Soyad
          </dt>
          <dd className="mt-1 font-medium text-white/90">{user.name}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Doğum Tarihi
          </dt>
          <dd className="mt-1 text-white/75">{user.birthDate}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Doğum Saati
          </dt>
          <dd className="mt-1 text-white/75">{user.birthTime}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Doğum Yeri
          </dt>
          <dd className="mt-1 text-white/75">{user.birthPlace}</dd>
        </div>
      </dl>

      <Link
        href="/profile-setup?mode=edit"
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs uppercase tracking-[0.18em] text-amber-300/85 transition hover:border-amber-400/25 hover:bg-white/[0.06]"
      >
        Profili Düzenle · PIN Yönetimi
      </Link>
    </motion.section>
  );
}

export default function ProfileTabContent() {
  const { userData, isPending, error } = useUserProfile();

  if (isPending) {
    return <TabPageSkeleton />;
  }

  if (!userData) {
    return (
      <div className="relative mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm text-white/60">
          {error ?? "Profil bilgileri bulunamadı."}
        </p>
      </div>
    );
  }

  return (
    <TabPageScaffold
      eyebrow="Profile"
      title={userData.name}
      description="Kullanıcı verileri, partner bağlantısı ve uygulama ayarları."
    >
      <div className="space-y-4">
        <ProfileSectionHeading title="Kullanıcı Verileri" />

        <UserInfoSection user={userData} />

        <Suspense fallback={<SectionSkeleton title="Rozetlerim" />}>
          <AchievementsSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Partner & Astro-Bağ" />}>
          <ProfileInfoSection />
        </Suspense>
      </div>

      <div className="mt-8 space-y-4">
        <ProfileSectionHeading title="Uygulama Ayarları" />

        <Suspense fallback={<SectionSkeleton title="Yıldız Puanı" />}>
          <SessionCounter />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Kozmik Günlüğüm" />}>
          <div className="[&_section]:mt-0">
            <CosmicJournal />
          </div>
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Davet" />}>
          <ReferralPanel />
        </Suspense>

        <AdminUserBanPanel />

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
            Oturum
          </p>
          <p className="mt-2 text-xs text-white/45">
            NFC oturumunuzu sonlandırın ve giriş ekranına dönün.
          </p>
          <div className="mt-4">
            <SignOutButton className="w-full" />
          </div>
        </motion.section>
      </div>
    </TabPageScaffold>
  );
}
