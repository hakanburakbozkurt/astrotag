"use client";

import { useEffect } from "react";
import { safeRouterReplace, useSafeRouter } from "@/lib/auth/safe-router-nav.client";

/** Eski /profile rotası → /dashboard yönlendirmesi */
export default function ProfileRedirectPage() {
  const { router } = useSafeRouter();

  useEffect(() => {
    void safeRouterReplace(router, "/profile/complete");
  }, [router]);

  return null;
}
