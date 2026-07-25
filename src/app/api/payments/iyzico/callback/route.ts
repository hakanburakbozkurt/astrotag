import { NextRequest, NextResponse } from "next/server";
import { completeCrystalPurchase } from "@/lib/payments/iyzico.server";

/** İyzico webhook / callback — ödeme onayı */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { transactionId?: string };
    const transactionId = body.transactionId?.trim();

    if (!transactionId) {
      return NextResponse.json({ ok: false, error: "transactionId gerekli" }, { status: 400 });
    }

    const result = await completeCrystalPurchase(transactionId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[iyzico/callback]", error);
    return NextResponse.json({ ok: false, error: "Callback işlenemedi" }, { status: 500 });
  }
}
