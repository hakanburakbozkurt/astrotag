export const MIN_PASSWORD_LENGTH = 8;

export function validatePasswordPair(
  password: string,
  confirmPassword: string
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  }

  if (password !== confirmPassword) {
    return "Şifreler eşleşmiyor.";
  }

  return null;
}

export function normalizeOtpCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}
