import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { logNfcError, logNfcEvent } from "@/lib/nfc/error-logger";
import {
  NFC_CARD_AUTH_SELECT,
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
  nfcCardQueryMeta,
} from "@/lib/nfc/nfc-card-table";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function getNfcSessionProfileId(): Promise<string | null> {
  const { getProtectedNfcAccess } = await import(
    "@/lib/nfc/protected-access.server"
  );
  const access = await getProtectedNfcAccess();
  return access?.profileId ?? null;
}

export async function requireNfcSessionProfileId(): Promise<string> {
  const { requireProtectedNfcAccess } = await import(
    "@/lib/nfc/protected-access.server"
  );
  const access = await requireProtectedNfcAccess();
  return access.profileId;
}

export type NfcCardActive = {
  nfcId: string;
  profileId: string | null;
  isClaimed: boolean;
  ownerId: string | null;
};

export type NfcCardValidationFailure = {
  ok: false;
  reason: "config_error" | "db_error" | "not_found" | "inactive";
};

export async function validateNfcCardActive(
  uniqueId: string
): Promise<({ ok: true } & NfcCardActive) | NfcCardValidationFailure> {
  const ctx = { layer: "action" as const, handler: "validateNfcCardActive" };
  const normalizedId = normalizeNfcUniqueId(uniqueId);
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from(NFC_CARD_TABLE)
      .select(NFC_CARD_AUTH_SELECT)
      .eq(NFC_CARD_SLUG_COLUMN, normalizedId)
      .maybeSingle();

    if (error) {
      console.error("[validateNfcCardActive] nfc_user_data sorgu hatası:", error);
      logNfcError(ctx, error, {
        ...nfcCardQueryMeta(normalizedId),
        step: "nfc_user_data.select",
      });
      return { ok: false, reason: "db_error" };
    }

    if (!data) {
      logNfcEvent("warn", ctx, "NFC kartı bulunamadı", { uniqueId: normalizedId });
      return { ok: false, reason: "not_found" };
    }

    if (!data.is_active) {
      logNfcEvent("warn", ctx, "NFC kartı pasif", {
        uniqueId: normalizedId,
        nfcId: data.id,
      });
      return { ok: false, reason: "inactive" };
    }

    return {
      ok: true,
      nfcId: data.id,
      profileId: data.profile_id ?? null,
      isClaimed: Boolean(data.is_claimed),
      ownerId: data.owner_id ?? null,
    };
  } catch (error) {
    console.error("[validateNfcCardActive] Beklenmeyen hata:", error);
    logNfcError(ctx, error, {
      ...nfcCardQueryMeta(normalizedId),
      step: "nfc_user_data.select",
    });
    return { ok: false, reason: "db_error" };
  }
}

export type NfcCardAuthEntry = NfcCardActive & {
  isActive: boolean;
};

export type NfcCardAuthLookupFailure = {
  ok: false;
  reason: "config_error" | "db_error" | "not_found";
};

export type NfcCardAuthLookupResult =
  | ({ ok: true } & NfcCardAuthEntry)
  | NfcCardAuthLookupFailure;

const NFC_CARD_AUTH_CACHE_TTL_SECONDS = 60;

async function queryNfcCardForAuth(
  normalizedId: string,
  rawUniqueId: string
): Promise<NfcCardAuthLookupResult> {
  const ctx = { layer: "action" as const, handler: "resolveNfcCardForAuth" };
  const queryMeta = nfcCardQueryMeta(normalizedId, rawUniqueId);
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from(NFC_CARD_TABLE)
      .select(NFC_CARD_AUTH_SELECT)
      .eq(NFC_CARD_SLUG_COLUMN, normalizedId)
      .maybeSingle();

    if (error) {
      logNfcError(ctx, error, {
        ...queryMeta,
        step: "nfc_user_data.select",
      });
      return { ok: false, reason: "db_error" };
    }

    if (!data) {
      logNfcEvent("warn", ctx, "NFC kartı bulunamadı", queryMeta);
      return { ok: false, reason: "not_found" };
    }

    return {
      ok: true,
      nfcId: data.id,
      profileId: data.profile_id ?? null,
      isClaimed: Boolean(data.is_claimed),
      ownerId: data.owner_id ?? null,
      isActive: Boolean(data.is_active),
    };
  } catch (error) {
    logNfcError(ctx, error, { uniqueId: normalizedId, step: "resolveNfcCardForAuth" });
    return { ok: false, reason: "db_error" };
  }
}

/** Kayıt / giriş — kart slug lookup (60 sn cache) */
export async function resolveNfcCardForAuth(
  uniqueId: string
): Promise<NfcCardAuthLookupResult> {
  const normalizedId = normalizeNfcUniqueId(uniqueId);

  if (!normalizedId.startsWith("at_")) {
    return { ok: false, reason: "not_found" };
  }

  const readCached = unstable_cache(
    () => queryNfcCardForAuth(normalizedId, uniqueId),
    ["resolveNfcCardForAuth", normalizedId],
    {
      revalidate: NFC_CARD_AUTH_CACHE_TTL_SECONDS,
      tags: [`nfc-card-auth:${normalizedId}`],
    }
  );

  return readCached();
}

export const getNfcCardForAuthEntry = cache(resolveNfcCardForAuth);
