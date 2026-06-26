import { redirect } from "next/navigation";
import RegistrationCompleteView from "@/components/profile/RegistrationCompleteView";
import { HOME_PATH } from "@/lib/nfc/constants";
import { getNfcSession } from "@/lib/nfc/session.server";

/** PIN oturumu sonrası kayıt tamamlama — oturum yoksa ana sayfa */
export default async function KayitTamamlaPage() {
  const session = await getNfcSession();

  if (!session) {
    redirect(HOME_PATH);
  }

  return <RegistrationCompleteView />;
}
