"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOutNfcSessionAction } from "@/lib/actions/nfc-auth";

type SignOutButtonProps = {
  className?: string;
  compact?: boolean;
};

export default function SignOutButton({
  className = "",
  compact = false,
}: SignOutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await signOutNfcSessionAction();
      router.replace("/");
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
