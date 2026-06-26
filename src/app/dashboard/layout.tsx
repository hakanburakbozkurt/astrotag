import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardTabShell from "@/components/navigation/DashboardTabShell";
import { HOME_PATH } from "@/lib/nfc/constants";
import { readServerCookieSessionAsync } from "@/lib/nfc/cookie-session.server";

/** Dashboard — yalnızca NFC oturumu zorunlu; profil gate yok */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const snapshot = await readServerCookieSessionAsync();

  if (!snapshot) {
    redirect(HOME_PATH);
  }

  return <DashboardTabShell>{children}</DashboardTabShell>;
}
