import { AUTH_LOGIN_PATH, AUTH_SIGNUP_PATH } from "@/lib/nfc/constants";

export interface GuestMenuLink {
  href: string;
  label: string;
}

export const GUEST_MENU_LINKS: GuestMenuLink[] = [
  { href: AUTH_LOGIN_PATH, label: "Giriş Yap" },
  { href: AUTH_SIGNUP_PATH, label: "Kayıt Ol" },
];
