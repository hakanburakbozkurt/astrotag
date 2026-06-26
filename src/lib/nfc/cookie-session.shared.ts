const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isNfcUuid(value: string | null | undefined): boolean {
  return Boolean(value?.trim() && UUID_RE.test(value.trim()));
}

export function isNfcSessionExpiredByIso(
  expiresAt: string | null | undefined
): boolean {
  if (!expiresAt?.trim()) {
    return false;
  }

  return new Date(expiresAt).getTime() <= Date.now();
}

export type CookieSessionSnapshot = {
  sessionId: string;
  profileId: string;
  nfcCardUuid: string | null;
  expiresAt: string | null;
  profileReady: boolean;
};

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export function readCookieSessionSnapshot(
  cookies: CookieReader,
  names: {
    session: string;
    profile: string;
    card: string;
    expires: string;
    profileReady: string;
  }
): CookieSessionSnapshot | null {
  const sessionId = cookies.get(names.session)?.value?.trim() ?? "";
  const profileId = cookies.get(names.profile)?.value?.trim() ?? "";
  const nfcCardUuid = cookies.get(names.card)?.value?.trim() ?? "";
  const expiresAt = cookies.get(names.expires)?.value?.trim() ?? null;
  const profileReady = cookies.get(names.profileReady)?.value === "1";

  if (!isNfcUuid(sessionId) || !isNfcUuid(profileId)) {
    return null;
  }

  if (isNfcSessionExpiredByIso(expiresAt)) {
    return null;
  }

  return {
    sessionId,
    profileId,
    nfcCardUuid: isNfcUuid(nfcCardUuid) ? nfcCardUuid : null,
    expiresAt,
    profileReady,
  };
}

/** "1" / "0" / null (çerez yok — legacy oturum) */
export function readProfileReadyFromCookie(
  cookies: CookieReader,
  profileReadyCookieName: string
): boolean | null {
  const raw = cookies.get(profileReadyCookieName)?.value;
  if (raw === "1") {
    return true;
  }
  if (raw === "0") {
    return false;
  }
  return null;
}
