import { redirect } from "next/navigation";
import RegistrationCompleteView from "@/components/profile/RegistrationCompleteView";
import {
  DASHBOARD_PATH,
  HOME_PATH,
} from "@/lib/nfc/constants";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";
import {
  isNfcUserDataRegistrationComplete,
} from "@/lib/nfc/profile-readiness.server";
import { getNfcSession } from "@/lib/nfc/session.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** PIN oturumu sonrası kayıt tamamlama — oturum yoksa ana sayfa */
export default async function KayitTamamlaPage() {
  const session = await getNfcSession();

  if (!session) {
    redirect(HOME_PATH);
  }

  try {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from(NFC_CARD_TABLE)
      .select("full_name, birth_date")
      .eq("id", session.nfcId)
      .maybeSingle();

    if (data && isNfcUserDataRegistrationComplete(data)) {
      redirect(DASHBOARD_PATH);
    }
  } catch {
    redirect(HOME_PATH);
  }

  return <RegistrationCompleteView />;
}
