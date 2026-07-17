"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { DASHBOARD_PATH } from "@/lib/nfc/constants";
import { ensureProfileForAuthUser } from "@/lib/nfc/ensure-profile.server";
import {
  isValidDigitalAccessCode,
  isValidExpertAccessCode,
  normalizeDigitalAccessCode,
  normalizeExpertAccessCode,
} from "@/lib/sales/quick-access-codes";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

const GUEST_TTL_MS = 24 * 60 * 60 * 1000;

export type QuickAccessResult =
  | { success: true; guestCode: string; redirectTo: string }
  | { success: true; redirectTo: string; guestCode?: undefined }
  | { success: false; error: string };

function generateGuestCode(): string {
  const segment = randomInt(1000, 10000);
  return `GUEST-${segment}`;
}

/** Oturum yoksa sunucuda anonymous sign-in — client auth/DB işlemi yapmaz */
async function ensureServerAuthUserId(): Promise<
  { userId: string } | { error: string }
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: "Oturum açılamadı. Lütfen tekrar deneyin." };
  }

  if (user?.id) {
    return { userId: user.id };
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInAnonymously();

  if (signInError || !signInData.user?.id) {
    return { error: "Oturum açılamadı. Lütfen tekrar deneyin." };
  }

  return { userId: signInData.user.id };
}

async function redeemAccessCode(
  userId: string,
  code: string,
  type: "DIG" | "EXP"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createServiceRoleClient();

  const { data: accessCode, error: lookupError } = await admin
    .from("access_codes")
    .select("id, active, type")
    .eq("code", code)
    .eq("type", type)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: "Kod doğrulanamadı. Lütfen tekrar deneyin." };
  }

  if (!accessCode?.id || !accessCode.active) {
    return { ok: false, error: "Geçersiz veya süresi dolmuş kod." };
  }

  const { error: redeemError } = await admin
    .from("access_codes")
    .update({
      active: false,
      redeemed_by: userId,
      redeemed_at: new Date().toISOString(),
    })
    .eq("id", accessCode.id)
    .eq("active", true);

  if (redeemError) {
    return { ok: false, error: "Kod kullanılamadı. Lütfen tekrar deneyin." };
  }

  return { ok: true };
}

/**
 * Misafir girişi — tek giriş noktası.
 * Auth (anonymous sign-in) + profiles INSERT/UPDATE yalnızca sunucuda;
 * service role ile RLS/privileged alan bypass.
 */
export async function finalizeGuestAccessAction(): Promise<QuickAccessResult> {
  const auth = await ensureServerAuthUserId();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    const supabaseAdmin = createServiceRoleClient();
    const { profileId } = await ensureProfileForAuthUser(auth.userId);

    const expiresAt = new Date(Date.now() + GUEST_TTL_MS).toISOString();
    let guestCode = generateGuestCode();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data: existingCode } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("guest_code", guestCode)
        .maybeSingle();

      if (!existingCode?.id) {
        break;
      }

      guestCode = generateGuestCode();
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_guest: true,
        expires_at: expiresAt,
        guest_code: guestCode,
        user_role: "user",
      })
      .eq("id", profileId);

    if (updateError) {
      return {
        success: false,
        error: "Misafir oturumu oluşturulamadı. Lütfen tekrar deneyin.",
      };
    }

    revalidatePath("/");
    revalidatePath(DASHBOARD_PATH);

    return {
      success: true,
      guestCode,
      redirectTo: `${DASHBOARD_PATH}?guest=1`,
    };
  } catch {
    return {
      success: false,
      error: "Misafir oturumu oluşturulamadı. Lütfen tekrar deneyin.",
    };
  }
}

/** 8 haneli DIG kodu — misafiri tam profile dönüştürür */
export async function redeemDigitalAccessCodeAction(
  rawCode: string
): Promise<QuickAccessResult> {
  const code = normalizeDigitalAccessCode(rawCode);

  if (!isValidDigitalAccessCode(code)) {
    return { success: false, error: "8 haneli geçerli bir kod girin." };
  }

  const auth = await ensureServerAuthUserId();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  const redeemed = await redeemAccessCode(auth.userId, code, "DIG");
  if (!redeemed.ok) {
    return { success: false, error: redeemed.error };
  }

  try {
    const supabaseAdmin = createServiceRoleClient();
    const { profileId } = await ensureProfileForAuthUser(auth.userId);

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_guest: false,
        expires_at: null,
        guest_code: null,
      })
      .eq("id", profileId);

    if (updateError) {
      return {
        success: false,
        error: "Profil güncellenemedi. Lütfen tekrar deneyin.",
      };
    }

    revalidatePath("/");
    revalidatePath(DASHBOARD_PATH);

    return { success: true, redirectTo: DASHBOARD_PATH };
  } catch {
    return {
      success: false,
      error: "Profil güncellenemedi. Lütfen tekrar deneyin.",
    };
  }
}

/** EXP-XXXX-XXXX — user_role = expert */
export async function redeemExpertAccessCodeAction(
  rawCode: string
): Promise<QuickAccessResult> {
  const code = normalizeExpertAccessCode(rawCode);

  if (!isValidExpertAccessCode(code)) {
    return {
      success: false,
      error: "Kod EXP-XXXX-XXXX formatında olmalıdır.",
    };
  }

  const auth = await ensureServerAuthUserId();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  const redeemed = await redeemAccessCode(auth.userId, code, "EXP");
  if (!redeemed.ok) {
    return { success: false, error: redeemed.error };
  }

  try {
    const supabaseAdmin = createServiceRoleClient();
    const { profileId } = await ensureProfileForAuthUser(auth.userId);

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ user_role: "expert" })
      .eq("id", profileId);

    if (updateError) {
      return {
        success: false,
        error: "Uzman rolü atanamadı. Lütfen tekrar deneyin.",
      };
    }

    revalidatePath("/");
    revalidatePath(DASHBOARD_PATH);

    return { success: true, redirectTo: DASHBOARD_PATH };
  } catch {
    return {
      success: false,
      error: "Uzman rolü atanamadı. Lütfen tekrar deneyin.",
    };
  }
}
