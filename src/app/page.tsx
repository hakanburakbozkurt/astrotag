"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LOGIN_PATH } from "@/lib/nfc/constants";

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    router.replace(LOGIN_PATH);
  }, [router]);

  if (!isMounted) {
    return null;
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center">
      <p className="text-sm text-white/45">Yönlendiriliyor...</p>
    </main>
  );
}
