"use server";

import {
  loginExpertAccount,
  registerExpertAccount,
} from "@/lib/expert/expert-auth.server";
import { nfcAuthSuccessAction } from "@/lib/actions/nfc-auth-success";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { expertNfcSlugForCode } from "@/lib/expert/expert-codes.shared";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export type ExpertAuthActionResult =
  | { ok: true; redirectTo: string; expertCode?: string }
  | { ok: false; error: string };

export async function registerExpertAction(input: {
  inviteCode: string;
  name: string;
  pin: string;
}): Promise<ExpertAuthActionResult> {
  return withNfcAction("registerExpertAction", async () => {
    const result = await registerExpertAccount(input);

    if (!result.ok) {
      return result;
    }

    await confirmStorageAccessAction();
    await nfcAuthSuccessAction(expertNfcSlugForCode(result.expertCode));

    return {
      ok: true,
      redirectTo: result.redirectTo,
      expertCode: result.expertCode,
    };
  });
}

export async function loginExpertAction(input: {
  expertCode: string;
  pin: string;
}): Promise<ExpertAuthActionResult> {
  return withNfcAction("loginExpertAction", async () => {
    const result = await loginExpertAccount(input);

    if (!result.ok) {
      return result;
    }

    const expertCode = input.expertCode.replace(/\D/g, "").slice(0, 8);
    await confirmStorageAccessAction();
    await nfcAuthSuccessAction(expertNfcSlugForCode(expertCode));

    return {
      ok: true,
      redirectTo: result.redirectTo,
      expertCode,
    };
  });
}
