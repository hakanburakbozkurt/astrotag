import "server-only";

import { normalizeWhatsAppAdminNumber } from "@/lib/support/whatsapp-recovery.config";

export type WhatsAppSendResult =
  | { ok: true; skipped?: false; messageId?: string }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

function readWhatsAppCloudConfig(): {
  accessToken: string;
  phoneNumberId: string;
} | null {
  const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim();

  if (!accessToken || !phoneNumberId) {
    return null;
  }

  return { accessToken, phoneNumberId };
}

/**
 * Meta WhatsApp Cloud API — metin mesajı.
 * WHATSAPP_CLOUD_ACCESS_TOKEN + WHATSAPP_CLOUD_PHONE_NUMBER_ID yoksa atlanır (non-blocking).
 */
export async function sendWhatsAppTextMessage(
  rawPhoneNumber: string,
  body: string
): Promise<WhatsAppSendResult> {
  const config = readWhatsAppCloudConfig();
  const to = normalizeWhatsAppAdminNumber(rawPhoneNumber);

  if (!to || to.length < 10) {
    return { ok: false, error: "Geçersiz telefon numarası." };
  }

  if (!config) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[whatsapp-notify] skipped (Cloud API not configured)", {
        to,
        bodyPreview: body.slice(0, 80),
      });
    }
    return {
      ok: true,
      skipped: true,
      reason: "WHATSAPP_CLOUD_ACCESS_TOKEN veya WHATSAPP_CLOUD_PHONE_NUMBER_ID tanımlı değil.",
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { preview_url: true, body },
        }),
      }
    );

    const payload = (await response.json()) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      return {
        ok: false,
        error: payload.error?.message ?? `WhatsApp API HTTP ${response.status}`,
      };
    }

    return { ok: true, messageId: payload.messages?.[0]?.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "WhatsApp gönderimi başarısız.",
    };
  }
}
