/** Varsayılan admin WhatsApp — uluslararası rakam (905XXXXXXXXX) */
export const WHATSAPP_ADMIN_NUMBER_DEFAULT = "905539559111";

export const WHATSAPP_RECOVERY_MESSAGE_PREFIX =
  "Selam Admin, Astrotag hesabımın/şifremin sıfırlanmasını istiyorum. Profilim/Kodum:";

/**
 * WhatsApp wa.me için uluslararası rakam formatı.
 * Kabul: +905539559111, 905539559111, 05539559111, 5539559111
 */
export function normalizeWhatsAppAdminNumber(
  raw: string | undefined | null
): string {
  const digits = raw?.replace(/\D/g, "") ?? "";

  if (!digits) {
    return WHATSAPP_ADMIN_NUMBER_DEFAULT;
  }

  if (digits.startsWith("90") && digits.length >= 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `90${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith("5")) {
    return `90${digits}`;
  }

  return digits;
}

function readWhatsAppAdminNumberFromEnv(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER?.trim() ||
    process.env.WHATSAPP_ADMIN_NUMBER?.trim();

  return raw || undefined;
}

/** İstemci + sunucu — önce .env, yoksa varsayılan */
export function getWhatsAppAdminNumberFromEnv(): string {
  return normalizeWhatsAppAdminNumber(readWhatsAppAdminNumberFromEnv());
}

/** @deprecated getWhatsAppAdminNumberFromEnv kullanın */
export const WHATSAPP_ADMIN_NUMBER = getWhatsAppAdminNumberFromEnv();
