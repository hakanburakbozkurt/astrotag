import "server-only";

import { unstable_cache } from "next/cache";
import {
  getWhatsAppAdminNumberFromEnv,
  normalizeWhatsAppAdminNumber,
  WHATSAPP_ADMIN_NUMBER_DEFAULT,
} from "@/lib/support/whatsapp-recovery.config";
import { createServiceRoleClient } from "@/lib/supabase/service";

const PLATFORM_SETTINGS_KEY = "whatsapp_admin_number";

function envWhatsAppNumberConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER?.trim() ||
      process.env.WHATSAPP_ADMIN_NUMBER?.trim()
  );
}

async function readWhatsAppAdminNumberFromDatabase(): Promise<string | null> {
  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", PLATFORM_SETTINGS_KEY)
      .maybeSingle();

    if (error || !data?.value?.trim()) {
      return null;
    }

    return normalizeWhatsAppAdminNumber(data.value);
  } catch {
    return null;
  }
}

const readCachedDbWhatsAppNumber = unstable_cache(
  readWhatsAppAdminNumberFromDatabase,
  ["platform_settings", PLATFORM_SETTINGS_KEY],
  { revalidate: 300 }
);

/**
 * Admin WhatsApp numarası — öncelik:
 * 1. WHATSAPP_ADMIN_NUMBER / NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER (.env)
 * 2. platform_settings.whatsapp_admin_number (veritabanı)
 * 3. WHATSAPP_ADMIN_NUMBER_DEFAULT
 */
export async function resolveWhatsAppAdminNumber(): Promise<string> {
  if (envWhatsAppNumberConfigured()) {
    return getWhatsAppAdminNumberFromEnv();
  }

  const fromDb = await readCachedDbWhatsAppNumber();
  if (fromDb) {
    return fromDb;
  }

  return WHATSAPP_ADMIN_NUMBER_DEFAULT;
}
