import { type NextRequest } from "next/server";
import { handleProxyRequest } from "@/lib/nfc/request-gate";

/**
 * Next.js 16.x — middleware.ts yerine proxy.ts.
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function proxy(request: NextRequest) {
  return handleProxyRequest(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
