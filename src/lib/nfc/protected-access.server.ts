import "server-only";

import { logNfcError, logNfcEvent } from "@/lib/nfc/error-logger";
import { NFC_CARD_OWNED_BY_OTHER_MESSAGE } from "@/lib/nfc/constants";
import { getTrustedDeviceFromCookies } from "@/lib/nfc/device-cookies.server";
import {
  getNfcSession,
  type NfcSessionRecord,
} from "@/lib/nfc/session.server";
import { findTrustedDevice } from "@/lib/nfc/trusted-devices.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type ProtectedNfcAccessErrorCode =
  | "session_missing"
  | "session_invalid"
  | "device_bound_missing"
  | "ownership_mismatch";

export class ProtectedNfcAccessError extends Error {
  readonly code: ProtectedNfcAccessErrorCode;

  constructor(message: string, code: ProtectedNfcAccessErrorCode) {
    super(message);
    this.name = "ProtectedNfcAccessError";
    this.code = code;
  }
}

export type ProtectedNfcContext = {
  session: NfcSessionRecord;
  profileId: string;
  nfcCardUuid: string;
  uniqueId: string;
  authUserId: string;
  isClaimed: boolean;
  ownerId: string | null;
};

type NfcCardMeta = {
  unique_id: string;
  is_claimed: boolean;
  owner_id: string | null;
};

async function isSessionValidInDatabase(
  nfcCardUuid: string,
  fingerprint: string
): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("is_valid_nfc_session", {
    p_nfc_id: nfcCardUuid,
    p_fingerprint: fingerprint,
  });

  if (error) {
    logNfcError(
      { layer: "protected-access", handler: "is_valid_nfc_session" },
      error,
      { nfcCardUuid, rpcCode: error.code }
    );
    return false;
  }

  return Boolean(data);
}

async function loadCardMeta(nfcCardUuid: string): Promise<NfcCardMeta | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("nfc_cards")
    .select("unique_id, is_claimed, owner_id, is_active")
    .eq("id", nfcCardUuid)
    .maybeSingle();

  if (error) {
    logNfcError(
      { layer: "protected-access", handler: "loadCardMeta" },
      error,
      { nfcCardUuid, dbCode: error.code }
    );
    return null;
  }

  if (!data?.is_active || !data.unique_id) {
    logNfcEvent(
      "warn",
      { layer: "protected-access", handler: "loadCardMeta" },
      "Kart meta bulunamadı veya pasif",
      { nfcCardUuid, isActive: data?.is_active ?? null }
    );
    return null;
  }

  return {
    unique_id: data.unique_id,
    is_claimed: Boolean(data.is_claimed),
    owner_id: data.owner_id ?? null,
  };
}

/**
 * NFC session + DB doğrulama (is_valid_nfc_session) + device-bound çerezler.
 */
export async function getProtectedNfcAccess(): Promise<ProtectedNfcContext | null> {
  try {
    const session = await getNfcSession();
    if (!session) {
      logNfcEvent(
        "warn",
        { layer: "protected-access", handler: "getProtectedNfcAccess" },
        "Adım başarısız: nfc_session çerezi yok veya geçersiz",
        { step: "getNfcSession" }
      );
      return null;
    }

    const sessionValid = await isSessionValidInDatabase(
      session.nfcId,
      session.fingerprint
    );

    if (!sessionValid) {
      logNfcEvent(
        "warn",
        { layer: "protected-access", handler: "getProtectedNfcAccess" },
        "Adım başarısız: is_valid_nfc_session false",
        {
          step: "is_valid_nfc_session",
          sessionId: session.sessionId,
          nfcCardUuid: session.nfcId,
        }
      );
      return null;
    }

    const card = await loadCardMeta(session.nfcId);
    if (!card) {
      return null;
    }

    const uniqueId = card.unique_id.trim();
    const cookies = await getTrustedDeviceFromCookies();

    if (cookies.nfcId !== uniqueId || !cookies.deviceToken) {
      logNfcEvent(
        "warn",
        { layer: "protected-access", handler: "getProtectedNfcAccess" },
        "Adım başarısız: trusted device çerezleri eksik veya unique_id uyuşmuyor",
        {
          step: "trusted_cookies",
          expectedUniqueId: uniqueId,
          cookieNfcId: cookies.nfcId,
          hasDeviceToken: Boolean(cookies.deviceToken),
        }
      );
      return null;
    }

    const trusted = await findTrustedDevice(uniqueId, cookies.deviceToken);
    if (!trusted?.user_id) {
      logNfcEvent(
        "warn",
        { layer: "protected-access", handler: "getProtectedNfcAccess" },
        "Adım başarısız: trusted_devices kaydı yok",
        { step: "findTrustedDevice", uniqueId }
      );
      return null;
    }

    if (
      card.is_claimed &&
      card.owner_id &&
      trusted.user_id !== card.owner_id
    ) {
      logNfcEvent(
        "warn",
        { layer: "protected-access", handler: "getProtectedNfcAccess" },
        "Adım başarısız: sahiplik uyuşmazlığı",
        {
          step: "ownership",
          ownerId: card.owner_id,
          trustedUserId: trusted.user_id,
        }
      );
      return null;
    }

    return {
      session,
      profileId: session.profileId,
      nfcCardUuid: session.nfcId,
      uniqueId,
      authUserId: trusted.user_id,
      isClaimed: card.is_claimed,
      ownerId: card.owner_id,
    };
  } catch (error) {
    logNfcError(
      { layer: "protected-access", handler: "getProtectedNfcAccess" },
      error
    );
    throw error;
  }
}

export async function requireProtectedNfcAccess(): Promise<ProtectedNfcContext> {
  const access = await getProtectedNfcAccess();

  if (!access) {
    throw new ProtectedNfcAccessError(
      "Oturum Sona Erdi veya Geçersiz Erişim",
      "device_bound_missing"
    );
  }

  return access;
}

export async function assertProfileMatchesProtectedAccess(
  profileId: string
): Promise<void> {
  const access = await requireProtectedNfcAccess();

  if (access.profileId !== profileId) {
    throw new ProtectedNfcAccessError(
      NFC_CARD_OWNED_BY_OTHER_MESSAGE,
      "ownership_mismatch"
    );
  }
}
