export type AuthMethod =
  | "nfc_pin"
  | "email_password"
  | "digital_code"
  | "expert_magic_link"
  | "guest_anonymous";

export type AuthSessionSnapshot = {
  authUserId: string;
  email: string | null;
  isAnonymous: boolean;
  expiresAt: number | null;
};

export type AuthActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };
