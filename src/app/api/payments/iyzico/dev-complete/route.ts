import { NextRequest, NextResponse } from "next/server";
import { completeCrystalPurchaseFromDev } from "@/lib/payments/iyzico.server";

/** Geliştirme modu — İyzico anahtarı yokken ödemeyi simüle eder */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tx = request.nextUrl.searchParams.get("tx")?.trim();

  if (!tx) {
    return NextResponse.redirect(new URL("/dashboard/profile?crystalError=1", request.url));
  }

  const result = await completeCrystalPurchaseFromDev(tx);

  if (!result.ok) {
    return NextResponse.redirect(
      new URL("/dashboard/profile?crystalError=1", request.url)
    );
  }

  return NextResponse.redirect(
    new URL(
      `/dashboard/profile?crystalSuccess=1&granted=${result.crystalsGranted ?? 0}`,
      request.url
    )
  );
}
