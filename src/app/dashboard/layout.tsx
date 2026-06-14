import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardTabShell from "@/components/navigation/DashboardTabShell";
import {
  HOME_PATH,
  PROFILE_SETUP_PATH,
} from "@/lib/nfc/constants";
import { isProfileComplete } from "@/lib/nfc/profile-readiness.server";
import { getNfcSession } from "@/lib/nfc/session.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Dashboard — NFC oturumu + profiles kurulumu zorunlu */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getNfcSession();

  if (!session?.profileId) {
    console.warn("[DashboardLayout] Oturum yok — ana sayfaya yönlendir");
    redirect(HOME_PATH);
  }

  try {
    const admin = createServiceRoleClient();
    const ready = await isProfileComplete(admin, session.profileId);

    if (!ready) {
      console.log("[DashboardLayout] Profil eksik — /profile-setup", {
        profileId: session.profileId,
      });
      redirect(PROFILE_SETUP_PATH);
    }
  } catch (error) {
    console.error("[DashboardLayout] Profil guard sorgusu başarısız", error);
    redirect(PROFILE_SETUP_PATH);
  }

  return <DashboardTabShell>{children}</DashboardTabShell>;
}
