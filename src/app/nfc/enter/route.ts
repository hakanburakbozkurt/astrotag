import { NextRequest, NextResponse } from "next/server";
import { establishNfcTapSession } from "@/lib/nfc/establish-tap-session.server";
import { NFC_LOGIN_PATH } from "@/lib/nfc/constants";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

/** NFC dokunuşu → oturum çerezi + dashboard (ana sayfaya düşmez) */
export async function GET(request: NextRequest) {
  const uid = normalizeNfcUniqueId(request.nextUrl.searchParams.get("uid") ?? "");
  const returnTo = request.nextUrl.searchParams.get("to")?.trim() ?? undefined;

  if (!uid) {
    return NextResponse.redirect(new URL(NFC_LOGIN_PATH, request.url));
  }

  const result = await establishNfcTapSession(uid, { returnTo });

  const target = new URL(result.ok ? result.redirectTo : result.fallbackTo, request.url);

  console.log("[NFC_ENTER]", {
    uid,
    ok: result.ok,
    redirectTo: target.pathname + target.search,
    reason: result.ok ? undefined : result.reason,
  });

  return NextResponse.redirect(target);
}
