import { redirect } from "next/navigation";
import RegistrationCompleteView from "@/components/profile/RegistrationCompleteView";
import { getAuthProfileContext } from "@/lib/auth/require-profile.server";
import { AUTH_LOGIN_PATH } from "@/lib/nfc/constants";

/** Kayıt tamamlama — Supabase oturumu zorunlu */
export default async function KayitTamamlaPage() {
  const authProfile = await getAuthProfileContext();

  if (!authProfile) {
    redirect(AUTH_LOGIN_PATH);
  }

  return <RegistrationCompleteView />;
}
