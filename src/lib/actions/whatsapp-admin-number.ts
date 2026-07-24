"use server";

import { resolveWhatsAppAdminNumber } from "@/lib/support/whatsapp-admin-number.server";

/** İstemci WhatsApp kurtarma bağlantısı — güncel admin numarası */
export async function getWhatsAppAdminNumberAction(): Promise<string> {
  return resolveWhatsAppAdminNumber();
}
