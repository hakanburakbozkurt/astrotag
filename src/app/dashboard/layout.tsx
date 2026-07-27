import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardTabShell from "@/components/navigation/DashboardTabShell";
import { getAuthProfileContext } from "@/lib/auth/require-profile.server";
import { AUTH_LOGIN_PATH, NFC_SUSPENDED_PATH } from "@/lib/nfc/constants";
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
    .select("is_active")
    .eq("id", authProfile.profileId)
    .maybeSingle();

  if (profile?.is_active === false) {
    redirect(NFC_SUSPENDED_PATH);
  }

  return <DashboardTabShell>{children}</DashboardTabShell>;
}
