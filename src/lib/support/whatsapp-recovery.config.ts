/** Admin WhatsApp — uluslararası format, + ve boşluksuz (örn. 905321234567) */
export const WHATSAPP_ADMIN_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER?.replace(/\D/g, "") ??
  "905000000000";

export const WHATSAPP_RECOVERY_MESSAGE_PREFIX =
  "Selam Admin, Astrotag hesabımın/şifremin sıfırlanmasını istiyorum. Profilim/Kodum:";
