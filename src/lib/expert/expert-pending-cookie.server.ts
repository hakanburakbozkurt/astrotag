import "server-only";

import { cookies } from "next/headers";
import { getStrictClearCookieOptions } from "@/lib/nfc/device-cookies.server";

export const EXPERT_PENDING_COOKIE = "astrotag_expert_pending";

export type ExpertPendingPayload =
  | {
      mode: "login";
      email: string;
    }
  | {
      mode: "register";
      email: string;
      inviteCode: string;
      name: string;
    };

export async function setExpertPendingCookie(
  payload: ExpertPendingPayload
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(EXPERT_PENDING_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60,
  });
}

export async function getExpertPendingCookie(): Promise<ExpertPendingPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(EXPERT_PENDING_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ExpertPendingPayload;
    if (!parsed.email?.trim() || !parsed.mode) {
      return null;
    }

    if (parsed.mode === "register") {
      if (!parsed.inviteCode?.trim() || !parsed.name?.trim()) {
        return null;
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function clearExpertPendingCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(EXPERT_PENDING_COOKIE, "", getStrictClearCookieOptions());
}
