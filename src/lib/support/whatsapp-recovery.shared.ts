import { SITE_URL } from "@/lib/nfc/constants";
import { cardEntryPathForUniqueId } from "@/lib/nfc/card-paths";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import {
  WHATSAPP_RECOVERY_MESSAGE_PREFIX,
  getWhatsAppAdminNumberFromEnv,
  normalizeWhatsAppAdminNumber,
} from "@/lib/support/whatsapp-recovery.config";

export type WhatsAppRecoveryKind = "nfc" | "expert";

export type WhatsAppRecoveryContext =
  | { kind: "nfc"; uniqueId: string }
  | { kind: "expert"; expertCode: string };

export function resolveRecoveryReference(context: WhatsAppRecoveryContext): string {
  if (context.kind === "nfc") {
    const uniqueId = normalizeNfcUniqueId(context.uniqueId);
    if (!uniqueId) {
      return SITE_URL;
    }
    return `${SITE_URL}${cardEntryPathForUniqueId(uniqueId)}`;
  }

  const code = context.expertCode.trim();
  if (!code || code === "00000000") {
    return "Uzman hesabım (kodumu hatırlamıyorum)";
  }

  return code;
}

export function buildWhatsAppRecoveryMessage(context: WhatsAppRecoveryContext): string {
  const reference = resolveRecoveryReference(context);
  return `${WHATSAPP_RECOVERY_MESSAGE_PREFIX} ${reference}`;
}

export function buildWhatsAppRecoveryUrl(
  context: WhatsAppRecoveryContext,
  adminNumber?: string
): string {
  const digits = normalizeWhatsAppAdminNumber(
    adminNumber ?? getWhatsAppAdminNumberFromEnv()
  );
  const text = encodeURIComponent(buildWhatsAppRecoveryMessage(context));
  return `https://wa.me/${digits}?text=${text}`;
}
