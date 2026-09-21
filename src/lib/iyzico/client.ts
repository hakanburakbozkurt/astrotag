import "server-only";

import { createHmac, randomBytes } from "crypto";
import {
  IYZICO_API_KEY,
  IYZICO_SECRET_KEY,
  IYZICO_BASE_URL,
} from "@/lib/payments/iyzico.config";
import type {
  IyzicoCheckoutInitializeRequest,
  IyzicoCheckoutInitializeResponse,
  IyzicoCheckoutRetrieveRequest,
  IyzicoCheckoutRetrieveResponse,
} from "@/lib/iyzico/types";

const CHECKOUT_INITIALIZE_PATH =
  "/payment/iyzipos/checkoutform/initialize/auth/ecom";
const CHECKOUT_RETRIEVE_PATH =
  "/payment/iyzipos/checkoutform/auth/ecom/detail";

function assertIyzicoCredentials(): void {
  if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
    throw new Error("IYZICO_API_KEY ve IYZICO_SECRET_KEY yapılandırılmalı.");
  }
}

function buildAuthorizationHeader(
  uriPath: string,
  body: string
): { authorization: string; randomKey: string } {
  const randomKey = `${Date.now()}${randomBytes(4).toString("hex")}`;
  const payload = `${randomKey}${uriPath}${body}`;
  const signature = createHmac("sha256", IYZICO_SECRET_KEY)
    .update(payload, "utf8")
    .digest("hex");

  const authorizationString = `apiKey:${IYZICO_API_KEY}&randomKey:${randomKey}&signature:${signature}`;
  const authorization = `IYZWSv2 ${Buffer.from(authorizationString, "utf8").toString("base64")}`;

  return { authorization, randomKey };
}

async function iyzicoPost<TResponse>(
  uriPath: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  assertIyzicoCredentials();

  const bodyString = JSON.stringify(body);
  const { authorization, randomKey } = buildAuthorizationHeader(uriPath, bodyString);

  const response = await fetch(`${IYZICO_BASE_URL}${uriPath}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      "x-iyzi-rnd": randomKey,
    },
    body: bodyString,
    cache: "no-store",
  });

  const data = (await response.json()) as TResponse;

  if (!response.ok) {
    throw new Error(
      `Iyzico HTTP ${response.status}: ${JSON.stringify(data).slice(0, 240)}`
    );
  }

  return data;
}

export function formatIyzicoPrice(amountTry: number): string {
  return amountTry.toFixed(2);
}

export async function initializeCheckoutForm(
  request: IyzicoCheckoutInitializeRequest
): Promise<IyzicoCheckoutInitializeResponse> {
  return iyzicoPost<IyzicoCheckoutInitializeResponse>(
    CHECKOUT_INITIALIZE_PATH,
    request as unknown as Record<string, unknown>
  );
}

export async function retrieveCheckoutFormResult(
  request: IyzicoCheckoutRetrieveRequest
): Promise<IyzicoCheckoutRetrieveResponse> {
  return iyzicoPost<IyzicoCheckoutRetrieveResponse>(
    CHECKOUT_RETRIEVE_PATH,
    request as unknown as Record<string, unknown>
  );
}
