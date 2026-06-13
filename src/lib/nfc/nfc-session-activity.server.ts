import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { NFC_IDLE_TIMEOUT_MINUTES, NFC_LOGIN_PATH } from "@/lib/nfc/constants";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

export const NFC_IDLE_TIMEOUT_MS = NFC_IDLE_TIMEOUT_MINUTES * 60 * 1000;

export type NfcSessionRow = {
  id: string;
  profile_id: string | null;
  nfc_id: string;
  expires_at: string;
  last_active_at: string | null;
};

export function isNfcSessionIdle(
  lastActiveAt: string | null | undefined
): boolean {
  if (!lastActiveAt?.trim()) {
    return false;
  }

  return Date.now() - new Date(lastActiveAt).getTime() > NFC_IDLE_TIMEOUT_MS;
}

export function buildNfcLoginPath(
  uniqueId: string,
  options?: { idle?: boolean }
): string {
  const slug = normalizeNfcUniqueId(uniqueId);
  if (!slug) {
    return NFC_LOGIN_PATH;
  }

  const params = new URLSearchParams({ uid: slug });
  if (options?.idle) {
    params.set("idle", "1");
  }

  return `${NFC_LOGIN_PATH}?${params.toString()}`;
}

export async function loadNfcSessionRow(
  supabase: SupabaseClient,
  sessionId: string
): Promise<NfcSessionRow | null> {
  const { data, error } = await supabase
    .from("nfc_sessions")
    .select("id, profile_id, nfc_id, expires_at, last_active_at")
    .eq("id", sessionId.trim())
    .maybeSingle();

  if (error || !data?.nfc_id) {
    return null;
  }

  return data as NfcSessionRow;
}

export async function resolveNfcSlugByCardUuid(
  supabase: SupabaseClient,
  nfcCardUuid: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select("nfc_id")
    .eq("id", nfcCardUuid.trim())
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.nfc_id?.trim() ?? null;
}

export async function touchNfcSessionActivity(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const nowIso = new Date().toISOString();

  await supabase
    .from("nfc_sessions")
    .update({ last_active_at: nowIso })
    .eq("id", sessionId.trim());
}

export async function invalidateNfcSessionById(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  await supabase.from("nfc_sessions").delete().eq("id", sessionId.trim());
}

export async function resolveIdleLogoutRedirect(
  supabase: SupabaseClient,
  nfcCardUuid: string
): Promise<string> {
  const slug = await resolveNfcSlugByCardUuid(supabase, nfcCardUuid);
  return slug ? buildNfcLoginPath(slug, { idle: true }) : NFC_LOGIN_PATH;
}

export function isNfcSessionExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}
