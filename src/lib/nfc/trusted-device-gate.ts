/**
 * Edge/middleware uyumlu güvenilir cihaz doğrulaması (Node-only import yok).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  TRUSTED_DEVICE_COOKIE,
  TRUSTED_NFC_COOKIE,
} from "@/lib/nfc/constants";

export type TrustedDeviceGateResult =
  | { ok: true; uniqueId: string }
  | { ok: false; uniqueId: string | null };

export async function validateTrustedDeviceBound(
  supabase: SupabaseClient,
  trustedNfc: string | undefined,
  deviceToken: string | undefined,
  sessionNfcCardUuid: string
): Promise<TrustedDeviceGateResult> {
  const { data: card, error: cardError } = await supabase
    .from("nfc_cards")
    .select("unique_id, is_claimed, owner_id")
    .eq("id", sessionNfcCardUuid)
    .maybeSingle();

  if (cardError || !card?.unique_id) {
    return { ok: false, uniqueId: null };
  }

  const uniqueId = card.unique_id.trim();
  const nfcCookie = trustedNfc?.trim();
  const token = deviceToken?.trim();

  if (!nfcCookie || !token || nfcCookie !== uniqueId) {
    return { ok: false, uniqueId };
  }

  const { data: trusted, error: trustedError } = await supabase
    .from("trusted_devices")
    .select("user_id")
    .eq("nfc_id", uniqueId)
    .eq("device_token", token)
    .maybeSingle();

  if (trustedError || !trusted?.user_id) {
    return { ok: false, uniqueId };
  }

  if (card.is_claimed && card.owner_id && trusted.user_id !== card.owner_id) {
    return { ok: false, uniqueId };
  }

  return { ok: true, uniqueId };
}

export function getTrustedCookiesFromRequest(cookies: {
  get: (name: string) => { value?: string } | undefined;
}): { trustedNfc: string | undefined; deviceToken: string | undefined } {
  return {
    trustedNfc: cookies.get(TRUSTED_NFC_COOKIE)?.value,
    deviceToken: cookies.get(TRUSTED_DEVICE_COOKIE)?.value,
  };
}

export function cardEntryPathForUniqueId(uniqueId: string): string {
  return `/c/${encodeURIComponent(uniqueId.trim())}`;
}
