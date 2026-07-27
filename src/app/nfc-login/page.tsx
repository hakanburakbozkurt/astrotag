import { redirect } from "next/navigation";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { AUTH_LOGIN_PATH } from "@/lib/nfc/constants";

type PageProps = {
  searchParams: Promise<{ uid?: string; idle?: string; module?: string; to?: string }>;
};

/** @deprecated PIN girişi kaldırıldı — e-posta girişine yönlendir */
export default async function NfcLoginPage({ searchParams }: PageProps) {
  const { uid, idle, module, to } = await searchParams;
  const uniqueId = uid ? normalizeNfcUniqueId(uid) : "";
  const params = new URLSearchParams();

  if (uniqueId) {
    params.set("nfc", uniqueId);
  }
  if (idle === "1") {
    params.set("msg", "session_expired");
  }
  if (module?.trim()) {
    params.set("module", module.trim());
  }
  if (to?.trim()) {
    params.set("to", to.trim());
  }

  const query = params.toString();
  redirect(query ? `${AUTH_LOGIN_PATH}?${query}` : AUTH_LOGIN_PATH);
}
