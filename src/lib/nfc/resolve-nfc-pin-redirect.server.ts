import "server-only";

import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  extractRootUniqueId,
  nfcLoginPathForUniqueId,
} from "@/lib/nfc/card-paths";
import {
  CARD_ENTRY_PREFIX,
  NFC_CARD_COOKIE,
  NFC_LOGIN_PATH,
  PENDING_NFC_COOKIE,
  PUBLIC_PROFILE_PREFIX,
} from "@/lib/nfc/constants";
import { resolveNfcSlugByCardUuid } from "@/lib/nfc/nfc-session-activity.server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

function slugToPinPath(slug: string): string | null {
  const normalized = normalizeNfcUniqueId(slug);
  if (!normalized.startsWith("at_")) {
    return null;
  }

  return nfcLoginPathForUniqueId(normalized);
}

function extractSlugFromPathname(pathname: string): string | null {
  const root = extractRootUniqueId(pathname);
  if (root?.startsWith("at_")) {
    return root;
  }

  if (pathname.startsWith(`${PUBLIC_PROFILE_PREFIX}/`)) {
    const segment = pathname.slice(`${PUBLIC_PROFILE_PREFIX}/`.length).split("/")[0];
    const slug = normalizeNfcUniqueId(segment);
    return slug.startsWith("at_") ? slug : null;
  }

  const lower = pathname.toLowerCase();
  if (lower.startsWith(`${CARD_ENTRY_PREFIX}/`)) {
    const segment = lower.slice(`${CARD_ENTRY_PREFIX}/`.length).split("/")[0];
    const slug = normalizeNfcUniqueId(segment);
    return slug.startsWith("at_") ? slug : null;
  }

  return null;
}

async function slugFromCardUuid(
  cardUuid: string,
  supabase?: SupabaseClient | null
): Promise<string | null> {
  const trimmed = cardUuid.trim();
  if (!trimmed) {
    return null;
  }

  const client = supabase ?? createServiceRoleClient();
  return resolveNfcSlugByCardUuid(client, trimmed);
}

/** Sunucu bileşenleri — çerezlerden PIN giriş rotası (asla ana sayfa değil) */
export async function resolveNfcPinRedirectFromCookies(): Promise<string> {
  const cookieStore = await cookies();

  const pending = cookieStore.get(PENDING_NFC_COOKIE)?.value?.trim();
  const pendingPath = pending ? slugToPinPath(pending) : null;
  if (pendingPath) {
    return pendingPath;
  }

  const cardUuid = cookieStore.get(NFC_CARD_COOKIE)?.value?.trim();
  if (cardUuid) {
    const slug = await slugFromCardUuid(cardUuid);
    const path = slug ? slugToPinPath(slug) : null;
    if (path) {
      return path;
    }
  }

  return NFC_LOGIN_PATH;
}

/** Middleware — istek bağlamından PIN giriş rotası */
export async function resolveNfcPinRedirectFromRequest(
  request: NextRequest,
  supabase?: SupabaseClient | null
): Promise<string> {
  const pending = request.cookies.get(PENDING_NFC_COOKIE)?.value?.trim();
  const pendingPath = pending ? slugToPinPath(pending) : null;
  if (pendingPath) {
    return pendingPath;
  }

  const fromPath = extractSlugFromPathname(request.nextUrl.pathname);
  const pathSlug = fromPath ? slugToPinPath(fromPath) : null;
  if (pathSlug) {
    return pathSlug;
  }

  const cardUuid = request.cookies.get(NFC_CARD_COOKIE)?.value?.trim();
  if (cardUuid) {
    const slug = await slugFromCardUuid(cardUuid, supabase);
    const path = slug ? slugToPinPath(slug) : null;
    if (path) {
      return path;
    }
  }

  return NFC_LOGIN_PATH;
}
