import { NextRequest, NextResponse } from "next/server";
import { guardApiNfcAccess } from "@/lib/nfc/api-guard";
import { logNfcError, sanitizeRequestHeaders } from "@/lib/nfc/error-logger";
import type { ProtectedNfcContext } from "@/lib/nfc/protected-access.server";
import {
  AI_RATE_LIMIT_MAX_REQUESTS,
  buildAiRateLimitKey,
  checkRateLimit,
} from "@/lib/security/rate-limit.server";

type NfcApiHandler = (
  request: NextRequest,
  access: ProtectedNfcContext
) => Promise<NextResponse>;

function applyAiRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetAt: number
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(AI_RATE_LIMIT_MAX_REQUESTS));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
  return response;
}

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

      if (request.nextUrl.pathname.startsWith("/api/ai")) {
        const rateKey = buildAiRateLimitKey(
          guard.access.profileId,
          request.nextUrl.pathname
        );
        const rate = checkRateLimit(rateKey);

        if (!rate.allowed) {
          return NextResponse.json(
            {
              error: "Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin.",
              retryAfterSec: rate.retryAfterSec,
            },
            {
              status: 429,
              headers: {
                "Retry-After": String(rate.retryAfterSec),
                "X-RateLimit-Limit": String(AI_RATE_LIMIT_MAX_REQUESTS),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(Math.ceil(rate.resetAt / 1000)),
              },
            }
          );
        }

        const response = await handler(request, guard.access);
        return applyAiRateLimitHeaders(response, rate.remaining, rate.resetAt);
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
