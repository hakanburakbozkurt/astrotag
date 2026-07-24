"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOutNfcAction } from "@/lib/actions/nfc-auth-signout";
import { invalidateAuthCache } from "@/lib/auth";
import { clearClientLastLogin } from "@/lib/nfc/last-login-persist.client";
import { HOME_PATH } from "@/lib/nfc/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type SignOutButtonProps = {
  className?: string;
  compact?: boolean;
  redirectTo?: string;
};

export default function SignOutButton({
  className = "",
  compact = false,
  redirectTo,
}: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    let target = redirectTo?.trim() || HOME_PATH;

    try {
      const result = await signOutNfcAction();
      target = redirectTo?.trim() || result.redirectTo || HOME_PATH;
    } catch (error) {
      console.error("[SignOutButton] server signOut failed:", error);
    }

    clearClientLastLogin();

    try {
      await invalidateAuthCache();
    } catch (error) {
      console.error("[SignOutButton] cache invalidate failed:", error);
    }

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("[SignOutButton] client signOut failed:", error);
    }

    window.location.assign(target);
  };

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={isSigningOut}
      className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55 transition hover:border-amber-400/25 hover:text-amber-100 disabled:opacity-50 ${className}`}
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden />
      {isSigningOut ? "..." : compact ? "Çıkış" : "Çıkış Yap"}
    </button>
  );
}
