import { PROFILE_EDIT_MODE_COOKIE } from "@/lib/nfc/constants";

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export function readProfileEditModeFromCookie(cookies: CookieReader): boolean {
  return cookies.get(PROFILE_EDIT_MODE_COOKIE)?.value === "1";
}
