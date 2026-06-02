import { NextResponse } from "next/server";
import {
  getProtectedNfcAccess,
  type ProtectedNfcContext,
} from "@/lib/nfc/protected-access.server";
import { cardEntryPathForUniqueId } from "@/lib/nfc/trusted-device-gate";

export const NFC_API_UNAUTHORIZED_MESSAGE =
  "Oturum geçersiz. Lütfen NFC kartınızı tekrar okutun.";

export type ApiNfcGuardResult =
  | { ok: true; access: ProtectedNfcContext }
  | { ok: false; response: NextResponse };

export async function guardApiNfcAccess(): Promise<ApiNfcGuardResult> {
  const access = await getProtectedNfcAccess();

  if (!access) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: NFC_API_UNAUTHORIZED_MESSAGE,
          reauth: true,
        },
        { status: 401 }
      ),
    };
  }

  return { ok: true, access };
}

export function nfcReauthRedirectPath(uniqueId: string): string {
  return `${cardEntryPathForUniqueId(uniqueId)}?reauth=1`;
}
