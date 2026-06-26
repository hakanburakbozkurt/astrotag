import "server-only";

import { logNfcError, logNfcEvent } from "@/lib/nfc/error-logger";
import { NFC_CARD_OWNED_BY_OTHER_MESSAGE } from "@/lib/nfc/constants";
import { readServerCookieSessionAsync } from "@/lib/nfc/cookie-session.server";
import {
  NFC_CARD_META_SELECT,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import {
  getNfcSession,
  type NfcSessionRecord,
} from "@/lib/nfc/session.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type ProtectedNfcAccessErrorCode =
  | "session_missing"
  | "session_invalid"
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
  authUserId: string | null;
  isClaimed: boolean;
  ownerId: string | null;
};

type NfcCardMeta = {
  nfc_id: string;
  is_claimed: boolean;
  owner_id: string | null;
};

async function isSessionValidInDatabase(sessionId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("nfc_sessions")
    .select("id")
    .eq("id", sessionId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    logNfcError(
      { layer: "protected-access", handler: "isSessionValidInDatabase" },
      error,
      { sessionId, dbCode: error.code }
    );
    return false;
  }

  return Boolean(data?.id);
}

async function loadCardMeta(nfcCardUuid: string): Promise<NfcCardMeta | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from(NFC_CARD_TABLE)
    .select(NFC_CARD_META_SELECT)
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

  if (!data?.is_active || !data.nfc_id) {
    logNfcEvent(
      "warn",
      { layer: "protected-access", handler: "loadCardMeta" },
      "Kart meta bulunamadı veya pasif",
      { nfcCardUuid, isActive: data?.is_active ?? null }
    );
    return null;
  }

  return {
    nfc_id: data.nfc_id,
    is_claimed: Boolean(data.is_claimed),
    owner_id: data.owner_id ?? null,
  };
}

function contextFromCookieSnapshot(
  snapshot: NonNullable<Awaited<ReturnType<typeof readServerCookieSessionAsync>>>
): ProtectedNfcContext {
  const expiresAt =
    snapshot.expiresAt ??
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  return {
    session: {
      sessionId: snapshot.sessionId,
      profileId: snapshot.profileId,
      nfcId: snapshot.nfcCardUuid ?? "",
      expiresAt,
    },
    profileId: snapshot.profileId,
    nfcCardUuid: snapshot.nfcCardUuid ?? "",
    uniqueId: "",
    authUserId: null,
    isClaimed: true,
    ownerId: null,
  };
}

/** Okuma işlemleri — çerez doğrulaması; DB sorgusu yok. */
export async function getProtectedNfcAccess(): Promise<ProtectedNfcContext | null> {
  try {
    const snapshot = await readServerCookieSessionAsync();
    if (!snapshot) {
      logNfcEvent(
        "warn",
        { layer: "protected-access", handler: "getProtectedNfcAccess" },
        "NFC oturum çerezi yok veya süresi dolmuş",
        { step: "readServerCookieSessionAsync" }
      );
      return null;
    }

    return contextFromCookieSnapshot(snapshot);
  } catch (error) {
    logNfcError(
      { layer: "protected-access", handler: "getProtectedNfcAccess" },
      error
    );
    throw error;
  }
}

/** Yazma işlemleri — oturum + kart sahipliği DB ile doğrulanır. */
export async function requireProtectedNfcAccess(): Promise<ProtectedNfcContext> {
  const session = await getNfcSession();
  if (!session) {
    throw new ProtectedNfcAccessError(
      "Oturum Sona Erdi veya Geçersiz Erişim",
      "session_missing"
    );
  }

  const sessionValid = await isSessionValidInDatabase(session.sessionId);

  if (!sessionValid) {
    throw new ProtectedNfcAccessError(
      "Oturum Sona Erdi veya Geçersiz Erişim",
      "session_invalid"
    );
  }

  const card = await loadCardMeta(session.nfcId);
  if (!card) {
    throw new ProtectedNfcAccessError(
      "Oturum Sona Erdi veya Geçersiz Erişim",
      "session_invalid"
    );
  }

  return {
    session,
    profileId: session.profileId,
    nfcCardUuid: session.nfcId,
    uniqueId: card.nfc_id.trim(),
    authUserId: card.owner_id,
    isClaimed: card.is_claimed,
    ownerId: card.owner_id,
  };
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
