import { handleIyzicoPaymentCallback } from "@/lib/payments/iyzico-callback.server";

/** İyzico Checkout Form callback — token doğrulama + kristal yükleme */
export async function POST(request: Request) {
  try {
    return await handleIyzicoPaymentCallback(request);
  } catch (error) {
    console.error("[iyzico/callback]", error);
    return Response.json({ ok: false, error: "Callback işlenemedi" }, { status: 500 });
  }
}
