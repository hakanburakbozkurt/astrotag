"use server";

import { setPostAuthReturnToCookie } from "@/lib/nfc/post-pin-redirect.server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

export async function savePostAuthReturnToAction(path: string): Promise<void> {
  return withNfcAction("savePostAuthReturnToAction", async () => {
    await setPostAuthReturnToCookie(path);
  });
}
