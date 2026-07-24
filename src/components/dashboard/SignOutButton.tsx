"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOutNfcAction } from "@/lib/actions/nfc-auth-signout";
import { invalidateAuthCache } from "@/lib/auth";
import { clearClientLastLogin } from "@/lib/nfc/last-login-persist.client";
import { HOME_PATH } from "@/lib/nfc/constants";

type SignOutButtonProps = {
  className?: string;
  compact?: boolean;
  /** Manuel yönlendirme — belirtilmezse sunucu profil tipine göre seçer */
  redirectTo?: string;
};

export default function SignOutButton({
  className = "",
  compact = false,
  redirectTo,
}: SignOutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const result = await signOutNfcAction();
      clearClientLastLogin();
      await invalidateAuthCache();

      const target =
        redirectTo?.trim() ||
        result.redirectTo ||
        HOME_PATH;

      router.refresh();
      router.push(target);
    } catch {
      setIsSigningOut(false);
    }
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
