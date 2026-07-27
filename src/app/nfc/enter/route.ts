import { NextRequest, NextResponse } from "next/server";
import { AUTH_LOGIN_PATH } from "@/lib/nfc/constants";
import { resolveNfcTagRedirect } from "@/lib/nfc/nfc-tag-redirect.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

/** NFC dokunuşu — oturum varsa dashboard, yoksa giriş */
export async function GET(request: NextRequest) {
  const uid = normalizeNfcUniqueId(request.nextUrl.searchParams.get("uid") ?? "");

  if (!uid) {
    return NextResponse.redirect(new URL(AUTH_LOGIN_PATH, request.url));
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const redirectTo = await resolveNfcTagRedirect(uid, query);

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
