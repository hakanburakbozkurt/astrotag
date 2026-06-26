import {
  AUTH_LOGIN_PATH,
  AUTH_SIGNUP_PATH,
  VERIFY_OTP_PATH,
} from "@/lib/nfc/constants";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

export function normalizeAuthPathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** Kayıt / giriş / OTP — middleware ve client guard'lar için serbest geçiş */
export function isAuthFormPath(pathname: string): boolean {
  const normalized = normalizeAuthPathname(pathname);
  return (
    normalized === AUTH_SIGNUP_PATH ||
    normalized === AUTH_LOGIN_PATH ||
    normalized === VERIFY_OTP_PATH
  );
}

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

function authPathClean(basePath: string, query?: AuthPathQuery): string {
  const params = new URLSearchParams();

  if (query?.email?.trim()) {
    params.set("email", query.email.trim().toLowerCase());
  }

  if (query?.msg?.trim()) {
    params.set("msg", query.msg.trim());
  }

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Giriş sayfası — nfc query olmadan (state / çerezden okunur) */
export function authLoginPathClean(query?: AuthPathQuery): string {
  return authPathClean(AUTH_LOGIN_PATH, query);
}

/** Kayıt sayfası — nfc query olmadan (state / çerezden okunur) */
export function authSignupPathClean(query?: AuthPathQuery): string {
  return authPathClean(AUTH_SIGNUP_PATH, query);
}

/** URL'de NFC kart kimliği var mı (signup/login döngüsünü önlemek için) */
export function hasNfcQueryParam(
  searchParams: URLSearchParams | { get(name: string): string | null }
): boolean {
  return Boolean(searchParams.get("nfc")?.trim());
}
