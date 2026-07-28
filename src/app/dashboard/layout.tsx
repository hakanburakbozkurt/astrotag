import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import GuestSessionGuard from "@/components/auth/GuestSessionGuard";
import DashboardTabShell from "@/components/navigation/DashboardTabShell";
import { getAuthProfileContext } from "@/lib/auth/require-profile.server";
import { AUTH_LOGIN_PATH, AUTH_SIGNUP_PATH, NFC_SUSPENDED_PATH } from "@/lib/nfc/constants";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Dashboard — Supabase Auth oturumu zorunlu */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const authProfile = await getAuthProfileContext();

  if (!authProfile) {
    redirect(AUTH_LOGIN_PATH);
  }

  const admin = createServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_active, is_guest, expires_at")
    .eq("id", authProfile.profileId)
    .maybeSingle();

  if (profile?.is_active === false) {
    redirect(NFC_SUSPENDED_PATH);
  }

  if (
    profile?.is_guest &&
    profile.expires_at &&
    new Date(profile.expires_at).getTime() <= Date.now()
  ) {
    redirect("/auth/guest-expired");
  }

  return (
    <DashboardTabShell>
      <GuestSessionGuard
        isGuest={profile?.is_guest === true}
        expiresAt={profile?.expires_at ?? null}
      />
      {children}
    </DashboardTabShell>
  );
}
