import "server-only";

import {
  completeCrystalPurchaseFromCallback,
  completeCrystalPurchaseFromIyzicoToken,
} from "@/lib/payments/iyzico.server";

function extractCheckoutToken(
  form: FormData,
  jsonBody: Record<string, unknown> | null
): string | null {
  const fromForm = form.get("token");
  if (typeof fromForm === "string" && fromForm.trim()) {
    return fromForm.trim();
  }

  if (jsonBody) {
    const token = jsonBody.token;
    if (typeof token === "string" && token.trim()) {
      return token.trim();
    }
  }

  return null;
}

export async function handleIyzicoPaymentCallback(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  let jsonBody: Record<string, unknown> | null = null;
  let form = new FormData();

  try {
    if (contentType.includes("application/json")) {
      jsonBody = (await request.json()) as Record<string, unknown>;
    } else {
      form = await request.formData();
    }
  } catch {
    return Response.json({ ok: false, error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const checkoutToken = extractCheckoutToken(form, jsonBody);
  if (checkoutToken) {
    const result = await completeCrystalPurchaseFromIyzicoToken(checkoutToken);
    const redirectBase = new URL("/dashboard/profile", request.url);

    if (!result.ok) {
      redirectBase.searchParams.set("crystalError", "1");
      if (result.transactionId) {
        redirectBase.searchParams.set("tx", result.transactionId);
      }
      return Response.redirect(redirectBase, 303);
    }

    redirectBase.searchParams.set("crystalSuccess", "1");
    redirectBase.searchParams.set("granted", String(result.crystalsGranted ?? 0));
    return Response.redirect(redirectBase, 303);
  }

  const transactionId =
    (typeof jsonBody?.transactionId === "string" ? jsonBody.transactionId : null) ??
    (typeof form.get("transactionId") === "string"
      ? String(form.get("transactionId"))
      : null);

  if (!transactionId?.trim()) {
    return Response.json({ ok: false, error: "token veya transactionId gerekli" }, { status: 400 });
  }

  const signature =
    request.headers.get("x-astrotag-payment-signature") ??
    (typeof jsonBody?.signature === "string" ? jsonBody.signature : null);

  const result = await completeCrystalPurchaseFromCallback(transactionId.trim(), signature);

  if (!result.ok) {
    const status =
      process.env.NODE_ENV === "production" && result.error?.includes("imza") ? 401 : 400;
    return Response.json(result, { status });
  }

  return Response.json(result);
}
