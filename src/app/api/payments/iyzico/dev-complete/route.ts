import { NextRequest, NextResponse } from "next/server";
import { completeCrystalPurchaseFromDev } from "@/lib/payments/iyzico.server";
import {
  buildCrystalWalletRedirectUrl,
  resolvePublicSiteUrl,
} from "@/lib/payments/site-url.server";

/** Geliştirme modu — İyzico anahtarı yokken ödemeyi simüle eder */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tx = request.nextUrl.searchParams.get("tx")?.trim();
  const redirectOrigin = resolvePublicSiteUrl(request);

  if (!tx) {
    return NextResponse.redirect(
      buildCrystalWalletRedirectUrl({ baseUrl: redirectOrigin, success: false })
    );
  }

  const result = await completeCrystalPurchaseFromDev(tx);

  return NextResponse.redirect(
    buildCrystalWalletRedirectUrl({
      baseUrl: redirectOrigin,
      success: result.ok,
      granted: result.crystalsGranted,
      transactionId: tx,
    })
  );
}
