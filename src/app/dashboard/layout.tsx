import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardTabShell from "@/components/navigation/DashboardTabShell";
import { isAccountLoginAllowed } from "@/lib/nfc/account-status.server";
import { NFC_LOGIN_PATH, NFC_SUSPENDED_PATH } from "@/lib/nfc/constants";
import { readServerCookieSessionAsync } from "@/lib/nfc/cookie-session.server";

/** Dashboard — NFC oturumu + aktif hesap zorunlu */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const snapshot = await readServerCookieSessionAsync();

  if (!snapshot) {
    redirect(NFC_LOGIN_PATH);
  }

  const loginAllowed = await isAccountLoginAllowed({
    profileId: snapshot.profileId,
    nfcCardUuid: snapshot.nfcCardUuid ?? undefined,
  });

  if (!loginAllowed) {
    redirect(NFC_SUSPENDED_PATH);
  }

  return <DashboardTabShell>{children}</DashboardTabShell>;
}
