"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RegistrationModal from "@/components/RegistrationModal";
import { useUserProfile } from "@/lib/auth";
import { isDevAuthBypassActive } from "@/lib/dev-mode";
import { LOGIN_PATH } from "@/lib/supabase-actions";

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { user, userData, profileStatus, isLoading } = useUserProfile();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      sessionStorage.setItem("nfcId", id);
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isDevAuthBypassActive()) {
      router.replace("/dashboard");
      return;
    }

    if (!user) {
      router.replace(LOGIN_PATH);
      return;
    }

    if (profileStatus === "ready" && userData) {
      router.replace("/dashboard");
    }
  }, [isLoading, profileStatus, user, userData, router]);

  if (!isMounted) {
    return null;
  }

  if (isLoading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center">
        <p className="text-sm text-white/45">Kozmik bağlantı kuruluyor...</p>
      </main>
    );
  }

  if (isDevAuthBypassActive() || !user || userData) {
    return (
      <main className="relative flex min-h-screen items-center justify-center">
        <p className="text-sm text-white/45">Yönlendiriliyor...</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <RegistrationModal onComplete={() => router.push("/dashboard")} />
    </main>
  );
}
