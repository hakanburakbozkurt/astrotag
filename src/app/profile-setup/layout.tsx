import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthProfileContext } from "@/lib/auth/require-profile.server";
import { AUTH_LOGIN_PATH } from "@/lib/nfc/constants";

/** Supabase oturumu yoksa giriş sayfasına yönlendir */
export default async function ProfileSetupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const authProfile = await getAuthProfileContext();

  if (!authProfile) {
    redirect(AUTH_LOGIN_PATH);
  }

  return children;
}
