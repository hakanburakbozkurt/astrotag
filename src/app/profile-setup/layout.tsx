import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/nfc/constants";
import { readServerCookieSessionAsync } from "@/lib/nfc/cookie-session.server";

/** Oturum yoksa ana sayfaya — profil tamamlama durumuna göre yönlendirme yok */
export default async function ProfileSetupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const snapshot = await readServerCookieSessionAsync();

  if (!snapshot) {
    redirect(HOME_PATH);
  }

  return children;
}
