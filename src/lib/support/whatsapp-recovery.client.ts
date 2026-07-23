"use client";

import {
  buildWhatsAppRecoveryUrl,
  type WhatsAppRecoveryContext,
} from "@/lib/support/whatsapp-recovery.shared";

/** Admin WhatsApp hattına hazır kurtarma mesajı ile yönlendirir */
export function openWhatsAppRecovery(context: WhatsAppRecoveryContext): void {
  const url = buildWhatsAppRecoveryUrl(context);
  window.open(url, "_blank", "noopener,noreferrer");
}
