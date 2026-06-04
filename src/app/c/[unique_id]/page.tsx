import { redirect } from "next/navigation";
import { nfcAuthSignupPath } from "@/lib/nfc/auth-paths";
import { AUTH_MSG_CARD_NOT_ACTIVE } from "@/lib/nfc/constants";
import { resolveNfcCardForAuth } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import NfcCardEntryClient from "@/app/c/[unique_id]/NfcCardEntryClient";

type PageProps = {
  params: Promise<{ unique_id: string }>;
};

/** NFC okutma — pasif kartta sunucu redirect; aktif kartta istemci akışı */
export default async function NfcCardEntryPage({ params }: PageProps) {
  const { unique_id: rawId } = await params;
  const uniqueId = normalizeNfcUniqueId(rawId);

  const card = await resolveNfcCardForAuth(uniqueId);

  if (card.ok && !card.isActive) {
    redirect(
      nfcAuthSignupPath(uniqueId, { msg: AUTH_MSG_CARD_NOT_ACTIVE })
    );
  }

  return <NfcCardEntryClient uniqueId={uniqueId} />;
}
