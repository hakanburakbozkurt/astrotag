"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import ProfilPageShell from "@/components/profil/ProfilPageShell";
import { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";
import { checkIsAdminAction } from "@/lib/actions/admin-users";

const AdminExpertApprovalPanel = dynamic(
  () => import("@/components/admin/AdminExpertApprovalPanel"),
  { loading: () => <SectionSkeleton title="Admin · Uzman Onayları" /> }
);

const AdminUserBanPanel = dynamic(
  () => import("@/components/admin/AdminUserBanPanel"),
  { loading: () => <SectionSkeleton title="Admin · Hesap Yönetimi" /> }
);

export default function ProfilAdminContent() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const admin = await checkIsAdminAction();
      setIsAdmin(admin);
    })();
  }, []);

  if (isAdmin === null) {
    return (
      <ProfilPageShell
        eyebrow="Profil"
        title="Admin"
        description="Yönetim paneli yükleniyor."
      >
        <SectionSkeleton title="Admin · Yetki kontrolü" />
      </ProfilPageShell>
    );
  }

  if (!isAdmin) {
    return (
      <ProfilPageShell
        eyebrow="Profil"
        title="Admin"
        description="Bu sayfaya erişim yetkiniz bulunmuyor."
      >
        <section className="rounded-sm border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-sm leading-relaxed text-stone-400">
            Admin paneli yalnızca yetkili kullanıcılar içindir. Erişim için hesabınızın
            admin rolüne sahip olması gerekir.
          </p>
        </section>
      </ProfilPageShell>
    );
  }

  return (
    <ProfilPageShell
      eyebrow="Profil"
      title="Admin"
      description="Uzman başvurularını onaylayın ve hesap durumlarını yönetin."
    >
      <div className="space-y-4">
        <Suspense fallback={<SectionSkeleton title="Admin · Uzman Onayları" />}>
          <AdminExpertApprovalPanel />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Admin · Hesap Yönetimi" />}>
          <AdminUserBanPanel />
        </Suspense>
      </div>
    </ProfilPageShell>
  );
}
