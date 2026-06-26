import { REFERRAL_CODE_PREFIX } from "@/lib/constants/cosmic";

const CODE_SUFFIX_LENGTH = 6;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(): string {
  let suffix = "";

  for (let index = 0; index < CODE_SUFFIX_LENGTH; index += 1) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }

  return `${REFERRAL_CODE_PREFIX}${suffix}`;
}

export function normalizeReferralCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidReferralCodeFormat(value: string): boolean {
  const normalized = normalizeReferralCode(value);
  const pattern = /^REFASTRO-[A-Z0-9]{6}$/;
  return pattern.test(normalized);
}
