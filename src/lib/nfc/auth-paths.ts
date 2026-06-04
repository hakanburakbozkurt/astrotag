import { AUTH_LOGIN_PATH, AUTH_SIGNUP_PATH } from "@/lib/nfc/constants";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

type AuthPathQuery = {
  email?: string;
  msg?: string;
};

function buildAuthQuery(uniqueId: string, query?: AuthPathQuery): string {
  const params = new URLSearchParams({
    nfc: normalizeNfcUniqueId(uniqueId),
  });

  if (query?.email?.trim()) {
    params.set("email", query.email.trim().toLowerCase());
  }

  if (query?.msg?.trim()) {
    params.set("msg", query.msg.trim());
  }

  return params.toString();
}

export function nfcAuthSignupPath(uniqueId: string, query?: AuthPathQuery): string {
  return `${AUTH_SIGNUP_PATH}?${buildAuthQuery(uniqueId, query)}`;
}

export function nfcAuthLoginPath(uniqueId: string, query?: AuthPathQuery): string {
  return `${AUTH_LOGIN_PATH}?${buildAuthQuery(uniqueId, query)}`;
}

/** URL'de NFC kart kimliği var mı (signup/login döngüsünü önlemek için) */
export function hasNfcQueryParam(
  searchParams: URLSearchParams | { get(name: string): string | null }
): boolean {
  return Boolean(searchParams.get("nfc")?.trim());
}
