"use client";

import { useRedirectWhenReady } from "@/lib/auth/safe-router-nav.client";

/** Eski /profile rotası → /profile/complete yönlendirmesi */
export default function ProfileRedirectPage() {
  const { isRedirecting } = useRedirectWhenReady("/profile/complete", true, {
    replace: true,
  });

  if (isRedirecting) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-white/45">
        Yönlendiriliyor...
      </div>
    );
  }

  return null;
}
