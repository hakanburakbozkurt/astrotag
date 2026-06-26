import { NextRequest, NextResponse } from "next/server";
import { guardApiNfcAccess } from "@/lib/nfc/api-guard";
import { logNfcError, sanitizeRequestHeaders } from "@/lib/nfc/error-logger";
import type { ProtectedNfcContext } from "@/lib/nfc/protected-access.server";

type NfcApiHandler = (
  request: NextRequest,
  access: ProtectedNfcContext
) => Promise<NextResponse>;

/**
 * NFC korumalı API route'ları için standart try/catch + guard + konsol logu.
 */
export function withNfcApiRoute(handlerName: string, handler: NfcApiHandler) {
  return async function route(request: NextRequest): Promise<NextResponse> {
    const baseContext = {
      layer: "api" as const,
      handler: handlerName,
      pathname: request.nextUrl.pathname,
      method: request.method,
    };

    try {
      const guard = await guardApiNfcAccess();
      if (!guard.ok) {
        return guard.response;
      }

      return await handler(request, guard.access);
    } catch (error) {
      logNfcError(baseContext, error, {
        requestHeaders: sanitizeRequestHeaders(request.headers),
        url: request.nextUrl.toString(),
      });

      if (process.env.NODE_ENV === "development") {
        throw error;
      }

      const payload = {
        error: "Sunucu hatası.",
      };

      return NextResponse.json(payload, { status: 500 });
    }
  };
}
