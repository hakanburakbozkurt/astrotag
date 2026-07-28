"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { expireGuestSessionAction } from "@/lib/actions/auth-email";

type GuestSessionGuardProps = {
  isGuest: boolean;
  expiresAt: string | null;
};

function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} sa ${minutes} dk`;
  }

  return `${minutes} dk`;
}

export default function GuestSessionGuard({
  isGuest,
  expiresAt,
}: GuestSessionGuardProps) {
  const router = useRouter();
  const expiryMs = expiresAt ? new Date(expiresAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isGuest || !expiryMs) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [isGuest, expiryMs]);

  useEffect(() => {
    if (!isGuest || !expiryMs || expiryMs > now) {
      return;
    }

    void (async () => {
      const result = await expireGuestSessionAction();
      router.replace(result.redirectTo);
      router.refresh();
    })();
  }, [isGuest, expiryMs, now, router]);

  const remainingLabel = useMemo(() => {
    if (!isGuest || !expiryMs) {
      return null;
    }

    return formatRemaining(expiryMs - now);
  }, [isGuest, expiryMs, now]);

  if (!isGuest || !remainingLabel) {
    return null;
  }

  return (
    <div className="mx-4 mb-3 mt-2 rounded-2xl border border-amber-400/25 bg-amber-950/30 px-4 py-3 text-center text-xs text-amber-100/90">
      Misafir oturumu — kalan süre:{" "}
      <span className="font-semibold text-amber-200">{remainingLabel}</span>
      . Süre bitince kayıt olmanız istenecektir.
    </div>
  );
}
