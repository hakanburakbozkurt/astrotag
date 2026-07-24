"use client";

import { getWhatsAppAdminNumberAction } from "@/lib/actions/whatsapp-admin-number";
import {
  buildWhatsAppRecoveryUrl,
  type WhatsAppRecoveryContext,
} from "@/lib/support/whatsapp-recovery.shared";

/** Admin WhatsApp hattına hazır kurtarma mesajı ile yönlendirir */
export async function openWhatsAppRecovery(
  context: WhatsAppRecoveryContext
): Promise<void> {
  const adminNumber = await getWhatsAppAdminNumberAction();
  const url = buildWhatsAppRecoveryUrl(context, adminNumber);
  window.open(url, "_blank", "noopener,noreferrer");
}
