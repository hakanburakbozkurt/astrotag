import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  HOME_PATH,
  REGISTRATION_COMPLETE_PATH,
} from "@/lib/nfc/constants";
import {
  isNfcUserDataRegistrationComplete,
  loadNfcUserDataRegistrationByProfileId,
} from "@/lib/nfc/profile-readiness.server";
import { getNfcSession } from "@/lib/nfc/session.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Dashboard — NFC oturumu + nfc_user_data kayıt tamamlama zorunlu */
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

  let registration = null;

  try {
    const admin = createServiceRoleClient();
    registration = await loadNfcUserDataRegistrationByProfileId(
      admin,
      session.profileId
    );
  } catch (error) {
    console.error("[DashboardLayout] Profil guard sorgusu başarısız", error);
    redirect(REGISTRATION_COMPLETE_PATH);
  }

  if (
    !registration ||
    !isNfcUserDataRegistrationComplete(registration)
  ) {
    console.log("[DashboardLayout] Kayıt eksik — /kayit-tamamla", {
      profileId: session.profileId,
      hasRegistration: Boolean(registration),
    });
    redirect(REGISTRATION_COMPLETE_PATH);
  }

  return children;
}
