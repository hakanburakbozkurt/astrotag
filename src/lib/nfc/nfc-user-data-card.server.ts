import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { INVALID_NFC_CARD_MESSAGE } from "@/lib/nfc/constants";
import {
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

export type NfcUserDataSessionCard = {
  id: string;
  nfc_id: string;
  profile_id: string | null;
  is_active: boolean;
};

const NFC_USER_DATA_SESSION_SELECT =
  "id, nfc_id, profile_id, is_active" as const;

/** Slug ile nfc_user_data kart satırı — oturum FK hedefi yalnızca bu id olabilir */
export async function loadNfcUserDataCardBySlug(
  supabase: SupabaseClient,
  uniqueId: string
): Promise<NfcUserDataSessionCard | null> {
  const normalizedSlug = normalizeNfcUniqueId(uniqueId);

  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select(NFC_USER_DATA_SESSION_SELECT)
    .eq(NFC_CARD_SLUG_COLUMN, normalizedSlug)
    .maybeSingle();

  if (error || !data?.id) {
    console.error("[loadNfcUserDataCardBySlug] kart bulunamadı", {
      slug: normalizedSlug,
      dbError: error?.message ?? null,
    });
    return null;
  }

  return data as NfcUserDataSessionCard;
}

/** nfc_sessions.nfc_id FK — uuid nfc_user_data.id tablosunda var mı? */
export async function loadNfcUserDataCardById(
  supabase: SupabaseClient,
  nfcCardUuid: string
): Promise<NfcUserDataSessionCard | null> {
  const trimmedId = nfcCardUuid?.trim() ?? "";

  if (!trimmedId) {
    return null;
  }

  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select(NFC_USER_DATA_SESSION_SELECT)
    .eq("id", trimmedId)
    .maybeSingle();

  if (error || !data?.id) {
    console.error("[loadNfcUserDataCardById] id nfc_user_data'da yok", {
      nfcCardUuid: trimmedId,
      dbError: error?.message ?? null,
    });
    return null;
  }

  return data as NfcUserDataSessionCard;
}

/**
 * Oturum açmadan önce: kart nfc_user_data'da kayıtlı ve slug eşleşiyor mu?
 */
export async function assertNfcUserDataCardForSession(
  supabase: SupabaseClient,
  params: { uniqueId: string; nfcCardUuid?: string }
): Promise<
  | { ok: true; card: NfcUserDataSessionCard }
  | { ok: false; error: string }
> {
  const normalizedSlug = normalizeNfcUniqueId(params.uniqueId);
  const cardBySlug = await loadNfcUserDataCardBySlug(supabase, normalizedSlug);

  if (!cardBySlug) {
    console.error("[assertNfcUserDataCardForSession] Geçersiz Kart — slug satırı yok", {
      slug: normalizedSlug,
    });
    return { ok: false, error: INVALID_NFC_CARD_MESSAGE };
  }

  if (params.nfcCardUuid?.trim()) {
    const cardById = await loadNfcUserDataCardById(
      supabase,
      params.nfcCardUuid.trim()
    );

    if (!cardById || cardById.id !== cardBySlug.id) {
      console.error(
        "[assertNfcUserDataCardForSession] Geçersiz Kart — id slug ile eşleşmiyor",
        {
          slug: normalizedSlug,
          slugRowId: cardBySlug.id,
          requestedId: params.nfcCardUuid.trim(),
          requestedIdFound: Boolean(cardById),
          requestedIdRowSlug: cardById?.nfc_id ?? null,
        }
      );
      return { ok: false, error: INVALID_NFC_CARD_MESSAGE };
    }
  }

  const verifiedById = await loadNfcUserDataCardById(supabase, cardBySlug.id);

  if (!verifiedById) {
    console.error(
      "[assertNfcUserDataCardForSession] Geçersiz Kart — id FK hedefi doğrulanamadı",
      { nfcCardUuid: cardBySlug.id, slug: normalizedSlug }
    );
    return { ok: false, error: INVALID_NFC_CARD_MESSAGE };
  }

  if (!verifiedById.is_active) {
    return { ok: false, error: INVALID_NFC_CARD_MESSAGE };
  }

  return { ok: true, card: verifiedById };
}
