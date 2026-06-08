import { redirect } from "next/navigation";
import { cardEntryPathForUniqueId } from "@/lib/nfc/card-paths";
import { resolveInitialNfcId } from "@/lib/nfc/resolve-initial-nfc-id.server";
import { HOME_PATH } from "@/lib/nfc/constants";

type PageProps = {
  searchParams: Promise<{ nfc?: string }>;
};

/** Kayıt kaldırıldı — /{unique_id} doğrulama sayfasına yönlendir */
export default async function AuthSignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialNfcId = await resolveInitialNfcId(params.nfc);

  if (!initialNfcId) {
    redirect(HOME_PATH);
  }

  redirect(cardEntryPathForUniqueId(initialNfcId));
}
