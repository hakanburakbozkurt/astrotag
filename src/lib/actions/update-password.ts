"use server";

import { updateAuthenticatedPassword } from "@/lib/auth/auth-service.server";
import type { AuthActionResult } from "@/lib/auth/auth-service.types";

export async function updateUserPassword(
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  const result: AuthActionResult = await updateAuthenticatedPassword(newPassword);

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
