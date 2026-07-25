"use server";

import {
  finalizeExpertEmailAuth,
  sendExpertLoginMagicLink,
  sendExpertRegisterMagicLink,
} from "@/lib/expert/expert-auth.server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export type ExpertAuthActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function sendExpertLoginLinkAction(input: {
  email: string;
}): Promise<ExpertAuthActionResult> {
  return withNfcAction("sendExpertLoginLinkAction", async () => {
    const result = await sendExpertLoginMagicLink(input.email);

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return {
      ok: true,
      message: "Giriş bağlantısı e-posta adresinize gönderildi.",
    };
  });
}

export async function sendExpertRegisterLinkAction(input: {
  email: string;
  name: string;
  title: string;
  tradition: string;
  experienceYears: number;
  aboutText: string;
}): Promise<ExpertAuthActionResult> {
  return withNfcAction("sendExpertRegisterLinkAction", async () => {
    const result = await sendExpertRegisterMagicLink(input);

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return {
      ok: true,
      message: "Kayıt bağlantısı e-posta adresinize gönderildi.",
    };
  });
}

export async function completeExpertEmailAuthAction(
  authUserId: string
): Promise<
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; redirectTo: string }
> {
  return withNfcAction("completeExpertEmailAuthAction", async () => {
    return finalizeExpertEmailAuth(authUserId);
  });
}
