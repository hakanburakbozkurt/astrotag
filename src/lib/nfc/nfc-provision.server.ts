import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import {
  NFC_CARD_AUTH_SELECT,
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { createProfileForNfcCard } from "@/lib/nfc/nfc-profile-link.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

const CTX = { layer: "action" as const, handler: "ensureNfcCardAndProfile" };

export type NfcProvisionResult = {
  nfcCardUuid: string;
  profileId: string;
  slug: string;
  profileCreated: boolean;
  cardCreated: boolean;
};

type NfcCardRow = {
  id: string;
  profile_id: string | null;
  is_active: boolean;
};

async function loadCardBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<NfcCardRow | null> {
  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select(NFC_CARD_AUTH_SELECT)
    .eq(NFC_CARD_SLUG_COLUMN, slug)
    .maybeSingle();

  if (error) {
    logNfcEvent("error", CTX, "Kart sorgusu başarısız", {
      slug,
      code: error.code,
      message: error.message,
    });
    return null;
  }

  return (data as NfcCardRow | null) ?? null;
}

async function insertNfcCard(
  supabase: SupabaseClient,
  slug: string
): Promise<NfcCardRow | null> {
  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .insert({
      nfc_id: slug,
      is_active: true,
    })
    .select(NFC_CARD_AUTH_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      return loadCardBySlug(supabase, slug);
    }

    logNfcEvent("error", CTX, "Kart INSERT başarısız", {
      slug,
      code: error.code,
      message: error.message,
    });
    return null;
  }

  console.log("[ensureNfcCardForProfile] Yeni kart oluşturuldu", {
    slug,
    nfcCardUuid: data.id,
  });

  return data as NfcCardRow;
}

async function loadProfileIdByNfcUid(
  supabase: SupabaseClient,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("nfc_uid", slug)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  return data.id.trim();
}

/** Oturum FK için nfc_user_data satırını profile bağla (profil zaten var). */
export async function ensureNfcCardForProfile(
  slugInput: string,
  profileId: string,
  supabase?: SupabaseClient
): Promise<{ nfcCardUuid: string; cardCreated: boolean } | null> {
  const slug = normalizeNfcUniqueId(slugInput);
  const trimmedProfileId = profileId?.trim() ?? "";

  if (!slug || !trimmedProfileId) {
    return null;
  }

  const admin = supabase ?? createServiceRoleClient();
  let cardCreated = false;

  let card = await loadCardBySlug(admin, slug);

  if (!card) {
    card = await insertNfcCard(admin, slug);
    cardCreated = Boolean(card);
  }

  if (!card?.id) {
    return null;
  }

  if (card.profile_id !== trimmedProfileId) {
    const { error: linkError } = await admin
      .from(NFC_CARD_TABLE)
      .update({ profile_id: trimmedProfileId })
      .eq("id", card.id);

    if (linkError) {
      logNfcEvent("warn", CTX, "Kart profile bağlanamadı", {
        slug,
        profileId: trimmedProfileId,
        nfcCardUuid: card.id,
        code: linkError.code,
        message: linkError.message,
      });
    }
  }

  return { nfcCardUuid: card.id, cardCreated };
}

/**
 * NFC ilk okutulduğunda kart + profil yoksa otomatik oluşturur.
 * @deprecated Seed'li profiles akışında ensureNfcCardForProfile tercih edilir.
 */
export async function ensureNfcCardAndProfile(
  uniqueId: string,
  supabase?: SupabaseClient
): Promise<NfcProvisionResult | null> {
  const slug = normalizeNfcUniqueId(uniqueId);

  if (!slug || !slug.startsWith("at_")) {
    return null;
  }

  const admin = supabase ?? createServiceRoleClient();
  let cardCreated = false;

  let card = await loadCardBySlug(admin, slug);

  if (!card) {
    card = await insertNfcCard(admin, slug);
    cardCreated = Boolean(card);
  }

  if (!card?.id) {
    return null;
  }

  let profileId = await loadProfileIdByNfcUid(admin, slug);
  let profileCreated = false;

  if (!profileId) {
    profileId = await createProfileForNfcCard(admin, card.id, slug);
    profileCreated = Boolean(profileId);

    if (!profileId) {
      return null;
    }

    console.log("[ensureNfcCardAndProfile] Yeni profil oluşturuldu", {
      slug,
      profileId,
      nfcCardUuid: card.id,
    });
  } else if (card.profile_id !== profileId) {
    const { error: linkError } = await admin
      .from(NFC_CARD_TABLE)
      .update({ profile_id: profileId })
      .eq("id", card.id);

    if (linkError) {
      logNfcEvent("warn", CTX, "Kart profile bağlanamadı", {
        slug,
        profileId,
        nfcCardUuid: card.id,
        code: linkError.code,
        message: linkError.message,
      });
    }
  }

  return {
    nfcCardUuid: card.id,
    profileId,
    slug,
    profileCreated,
    cardCreated,
  };
}
