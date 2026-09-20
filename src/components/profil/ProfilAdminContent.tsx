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

const AdminServiceCatalogPanel = dynamic(
  () => import("@/components/admin/AdminServiceCatalogPanel"),
  { loading: () => <SectionSkeleton title="Admin · Hizmetler" /> }
);

type AdminTab = "experts" | "services" | "users";

const ADMIN_TABS: { id: AdminTab; label: string }[] = [
  { id: "experts", label: "Uzman Onayları" },
  { id: "services", label: "Hizmetler" },
  { id: "users", label: "Hesaplar" },
];

export default function ProfilAdminContent() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("experts");

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
      description="Uzman başvuruları, hizmet kataloğu ve hesap yönetimi."
    >
      <div className="mb-4 flex w-full min-w-0 gap-2 rounded-sm border border-zinc-800 p-1">
        {ADMIN_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-sm px-3 py-2 text-xs transition ${
                isActive
                  ? "bg-zinc-800 text-stone-300"
                  : "text-stone-500 hover:text-stone-400"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "experts" ? (
        <Suspense fallback={<SectionSkeleton title="Admin · Uzman Onayları" />}>
          <AdminExpertApprovalPanel />
        </Suspense>
      ) : null}

      {activeTab === "services" ? (
        <Suspense fallback={<SectionSkeleton title="Admin · Hizmetler" />}>
          <AdminServiceCatalogPanel />
        </Suspense>
      ) : null}

      {activeTab === "users" ? (
        <Suspense fallback={<SectionSkeleton title="Admin · Hesap Yönetimi" />}>
          <AdminUserBanPanel />
        </Suspense>
      ) : null}
    </ProfilPageShell>
  );
}
