import "server-only";

import type { NextRequest } from "next/server";
import {
  getAuthProfileContext,
  getAuthProfileContextFromRequest,
  requireAuthProfileContext,
  type AuthProfileContext,
} from "@/lib/auth/require-profile.server";
import { logNfcError } from "@/lib/nfc/error-logger";
import { NFC_CARD_OWNED_BY_OTHER_MESSAGE } from "@/lib/nfc/constants";
import { NFC_CARD_TABLE } from "@/lib/nfc/nfc-card-table";

export type ProtectedNfcAccessErrorCode =
  | "session_missing"
  | "session_invalid"
  | "ownership_mismatch"
  | "account_suspended";

export class ProtectedNfcAccessError extends Error {
  readonly code: ProtectedNfcAccessErrorCode;

  constructor(message: string, code: ProtectedNfcAccessErrorCode) {
    super(message);
    this.name = "ProtectedNfcAccessError";
    this.code = code;
  }
}

/** @deprecated Supabase Auth profil bağlamı — geriye dönük uyumluluk */
export type ProtectedNfcContext = AuthProfileContext & {
  session: {
    sessionId: string;
    profileId: string;
    nfcId: string;
    expiresAt: string;
  };
  isClaimed: boolean;
  ownerId: string | null;
};

function toLegacyContext(context: AuthProfileContext): ProtectedNfcContext {
  return {
    ...context,
    session: {
      sessionId: context.authUserId,
      profileId: context.profileId,
      nfcId: context.nfcCardUuid ?? "",
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    },
    isClaimed: true,
    ownerId: context.authUserId,
  };
}

async function resolveNfcCardUuid(profileId: string): Promise<string | null> {
  const { createServiceRoleClient } = await import("@/lib/supabase/service");
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from(NFC_CARD_TABLE)
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  return data?.id ?? null;
}

async function buildProtectedNfcAccess(
  context: AuthProfileContext | null
): Promise<ProtectedNfcContext | null> {
  if (!context) {
    return null;
  }

  if (!context.nfcCardUuid) {
    const nfcCardUuid = await resolveNfcCardUuid(context.profileId);
    return toLegacyContext({ ...context, nfcCardUuid });
  }

  return toLegacyContext(context);
}

/** Supabase JWT oturumundan profil bağlamı */
export async function getProtectedNfcAccess(): Promise<ProtectedNfcContext | null> {
  try {
    return buildProtectedNfcAccess(await getAuthProfileContext());
  } catch (error) {
    logNfcError(
      { layer: "protected-access", handler: "getProtectedNfcAccess" },
      error
    );
    throw error;
  }
}

/** Mobil Bearer JWT — API route guard */
export async function getProtectedNfcAccessFromRequest(
  request: NextRequest
): Promise<ProtectedNfcContext | null> {
  try {
    return buildProtectedNfcAccess(await getAuthProfileContextFromRequest(request));
  } catch (error) {
    logNfcError(
      { layer: "protected-access", handler: "getProtectedNfcAccessFromRequest" },
      error
    );
    throw error;
  }
}

/** Yazma işlemleri — Supabase oturumu zorunlu */
export async function requireProtectedNfcAccess(): Promise<ProtectedNfcContext> {
  try {
    const context = await requireAuthProfileContext();
    const nfcCardUuid =
      context.nfcCardUuid ?? (await resolveNfcCardUuid(context.profileId));

    return toLegacyContext({ ...context, nfcCardUuid });
  } catch {
    throw new ProtectedNfcAccessError(
      "Oturum Sona Erdi veya Geçersiz Erişim",
      "session_missing"
    );
  }
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
