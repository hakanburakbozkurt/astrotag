"use client";

import Link from "next/link";
import CosmicDashboard from "@/components/dashboard/CosmicDashboard";
import Starfield from "@/components/Starfield";
import { useRequireAuth, useUserProfile } from "@/lib/auth";

export default function DashboardPage() {
  useRequireAuth();
  const { userData, profileStatus, isLoading, error } = useUserProfile();

  if (isLoading) {
    return (
      <main className="relative min-h-dvh">
        <Starfield />
        <div className="relative flex min-h-dvh items-center justify-center px-4">
          <p className="text-sm text-white/45">Kozmik bağlantı kuruluyor...</p>
        </div>
      </main>
    );
  }

  if (profileStatus === "error") {
    return (
      <main className="relative min-h-dvh">
        <Starfield />
        <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.25em] text-red-300/70">
            Profil Hatası
          </p>
          <p className="mt-3 text-sm text-white/60">
            {error ?? "Profil bilgileri yüklenemedi."}
          </p>
          <Link
            href="/login"
            className="mt-6 rounded-xl border border-amber-400/30 px-5 py-2.5 text-sm text-amber-100"
          >
            Giriş Sayfasına Dön
          </Link>
        </div>
      </main>
    );
  }

  if (profileStatus === "empty" || !userData) {
    return (
      <main className="relative min-h-dvh">
        <Starfield />
        <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
            Profil Eksik
          </p>
          <p className="mt-3 text-sm text-white/60">
            Doğum haritası bilgileriniz henüz tamamlanmamış.
          </p>
          <Link
            href="/profile/complete"
            className="mt-6 rounded-xl border border-amber-400/30 px-5 py-2.5 text-sm text-amber-100"
          >
            Profili Tamamla
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-y-auto">
      <Starfield />
      <CosmicDashboard user={userData} />
    </main>
  );
}
