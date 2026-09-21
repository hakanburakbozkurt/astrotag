import { NextRequest, NextResponse } from "next/server";
import { finalizeCrystalPurchaseReturn } from "@/lib/payments/iyzico.server";

/** Kullanıcı İyzico ödeme sayfasından dönüş — pending ise retrieve ile doğrular */
export async function GET(request: NextRequest) {
  const tx = request.nextUrl.searchParams.get("tx")?.trim();

  if (!tx) {
    return NextResponse.redirect(new URL("/dashboard/profile?crystalError=1", request.url));
  }

  try {
    const result = await finalizeCrystalPurchaseReturn(tx);

    if (!result.ok) {
      return NextResponse.redirect(
        new URL(`/dashboard/profile?crystalError=1&tx=${encodeURIComponent(tx)}`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(
        `/dashboard/profile?crystalSuccess=1&granted=${result.crystalsGranted ?? 0}`,
        request.url
      )
    );
  } catch (error) {
    console.error("[iyzico/return]", error);
    return NextResponse.redirect(new URL("/dashboard/profile?crystalError=1", request.url));
  }
}
