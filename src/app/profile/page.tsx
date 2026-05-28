"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Eski /profile rotası → /dashboard yönlendirmesi */
export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile/complete");
  }, [router]);

  return null;
}
