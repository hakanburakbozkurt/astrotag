import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DASHBOARD_PATH, HOME_PATH } from "@/lib/nfc/constants";
import { isProfileComplete } from "@/lib/nfc/profile-readiness.server";
import { getNfcSession } from "@/lib/nfc/session.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Profil tamamlandıysa dashboard'a; oturum yoksa ana sayfaya */
export default async function ProfileSetupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getNfcSession();

  if (!session?.profileId) {
    redirect(HOME_PATH);
  }

  try {
    const admin = createServiceRoleClient();
    const complete = await isProfileComplete(admin, session.profileId);

    if (complete) {
      redirect(DASHBOARD_PATH);
    }
  } catch {
    redirect(HOME_PATH);
  }

  return children;
}
