import "server-only";

import { SITE_URL } from "@/lib/nfc/constants";
import { sendWhatsAppTextMessage } from "@/lib/support/whatsapp-notify.server";
import { createServiceRoleClient } from "@/lib/supabase/service";

const EXPERT_REQUESTS_PATH = "/dashboard/expert-requests";

export function buildExpertPaymentNotifyMessage(): string {
  const panelUrl = `${SITE_URL}${EXPERT_REQUESTS_PATH}`;
  return (
    `Bir kullanıcı deneyiminizi paylaşmanız için size ödeme yaptı. ` +
    `Hemen profilinize gidip yanıt verin: ${panelUrl}`
  );
}

/**
 * Uzman hizmet ödemesi sonrası gizli phone_number üzerinden WhatsApp bildirimi.
 * Hata durumunda ödeme akışını bozmaz (log + false dönebilir).
 */
export async function notifyExpertOfServicePayment(
  expertProfileId: string
): Promise<{ notified: boolean; skipped?: boolean; error?: string }> {
  const admin = createServiceRoleClient();

  const { data: expert, error } = await admin
    .from("expert_profiles")
    .select("phone_number, display_name")
    .eq("id", expertProfileId)
    .maybeSingle();

  if (error || !expert) {
    console.error("[notifyExpertOfServicePayment] expert lookup failed", error?.message);
    return { notified: false, error: "Uzman profili bulunamadı." };
  }

  const phone = expert.phone_number?.trim();
  if (!phone) {
    console.warn("[notifyExpertOfServicePayment] no phone_number", { expertProfileId });
    return { notified: false, skipped: true, error: "Uzman telefon numarası tanımlı değil." };
  }

  const result = await sendWhatsAppTextMessage(phone, buildExpertPaymentNotifyMessage());

  if (!result.ok) {
    console.error("[notifyExpertOfServicePayment] send failed", result.error);
    return { notified: false, error: result.error };
  }

  if (result.skipped) {
    return { notified: false, skipped: true, error: result.reason };
  }

  return { notified: true };
}
