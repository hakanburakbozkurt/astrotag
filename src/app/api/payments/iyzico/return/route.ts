import { NextRequest, NextResponse } from "next/server";
import { finalizeCrystalPurchaseReturn } from "@/lib/payments/iyzico.server";
import {
  buildCrystalWalletRedirectUrl,
  resolvePaymentRedirectOrigin,
} from "@/lib/payments/site-url.server";

/** Kullanıcı İyzico ödeme sayfasından dönüş — pending ise retrieve ile doğrular */
export async function GET(request: NextRequest) {
  const tx = request.nextUrl.searchParams.get("tx")?.trim();

  if (!tx) {
    const redirectOrigin = await resolvePaymentRedirectOrigin(request);
    return NextResponse.redirect(
      buildCrystalWalletRedirectUrl({ baseUrl: redirectOrigin, success: false })
    );
  }

  try {
    const result = await finalizeCrystalPurchaseReturn(tx);
    const redirectOrigin = await resolvePaymentRedirectOrigin(request, tx);

    return NextResponse.redirect(
      buildCrystalWalletRedirectUrl({
        baseUrl: redirectOrigin,
        success: result.ok,
        granted: result.crystalsGranted,
        transactionId: tx,
      })
    );
  } catch (error) {
    console.error("[iyzico/return]", error);
    const redirectOrigin = await resolvePaymentRedirectOrigin(request, tx);
    return NextResponse.redirect(
      buildCrystalWalletRedirectUrl({
        baseUrl: redirectOrigin,
        success: false,
        transactionId: tx,
      })
    );
  }
}
