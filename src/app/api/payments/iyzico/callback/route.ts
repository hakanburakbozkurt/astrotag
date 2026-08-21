import { NextRequest, NextResponse } from "next/server";
import { completeCrystalPurchaseFromCallback } from "@/lib/payments/iyzico.server";

const CALLBACK_SIGNATURE_HEADER = "x-astrotag-payment-signature";

/** İyzico webhook / callback — ödeme onayı (HMAC imza zorunlu, production) */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { transactionId?: string };
    const transactionId = body.transactionId?.trim();
    const signature =
      request.headers.get(CALLBACK_SIGNATURE_HEADER) ??
      (typeof body === "object" &&
      body !== null &&
      "signature" in body &&
      typeof (body as { signature?: unknown }).signature === "string"
        ? (body as { signature: string }).signature
        : null);

    if (!transactionId) {
      return NextResponse.json({ ok: false, error: "transactionId gerekli" }, { status: 400 });
    }

    const result = await completeCrystalPurchaseFromCallback(transactionId, signature);

    if (!result.ok) {
      const status =
        process.env.NODE_ENV === "production" &&
        result.error?.includes("imza")
          ? 401
          : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[iyzico/callback]", error);
    return NextResponse.json({ ok: false, error: "Callback işlenemedi" }, { status: 500 });
  }
}
